// src/components/layout/Header.tsx
import { FC, useCallback, useEffect, useMemo, useState, useRef } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAtom } from 'jotai';
import Button from '../common/Button';
import useAuth from '../../hooks/useAuth';
import { useTicketGroups } from '../../hooks/useTicketGroups';
import { sessionAtom } from '../../stores/session';
import { useScrollHeader } from '../../hooks/useScrollHeader';
import {
  Wallet,
  User,
  LogOut,
  LogIn,
  Trophy,
  Ticket,
  Loader
} from '../common/icons';

interface HeaderProps {
  onAuthTrigger: () => void;
}

// Separate component for pre-login header to ensure clean separation of concerns
const PreLoginHeader: FC<{onAuthTrigger: () => void, isVisible: boolean}> = ({onAuthTrigger, isVisible}) => {
  return (
    <>
      <motion.header
        className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm shadow-sm"
        initial={false}
        animate={{ y: isVisible ? 0 : '-100%' }}
      >
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link 
              to="/" 
              className="flex items-center space-x-2 flex-shrink-0"
            >
              <Trophy className="h-8 w-8 text-indigo-600" />
              <span className="text-xl md:text-2xl font-bold text-indigo-600 truncate">
                WildRandom
              </span>
            </Link>

            {/* Sign In Button - Only visible element besides logo */}
            <Button
              onClick={onAuthTrigger}
              size="sm"
              className="flex items-center space-x-2"
            >
              <LogIn size={18} />
              <span>Sign In</span>
            </Button>
          </div>
        </div>
      </motion.header>
      <div className="h-16" />
    </>
  );
};

// Main Header component that determines which version to render
const Header: FC<HeaderProps> = ({ onAuthTrigger }) => {
  const { user, isAuthenticated, logout } = useAuth();
  const { isVisible } = useScrollHeader();
  
  // Maintain clear component separation for authentication states
  if (!isAuthenticated) {
    return <PreLoginHeader onAuthTrigger={onAuthTrigger} isVisible={isVisible} />;
  }
  
  // Only render authenticated header when user is authenticated
  return <AuthenticatedHeader onAuthTrigger={onAuthTrigger} />;
};

// Separate component for authenticated header with full functionality
const AuthenticatedHeader: FC<HeaderProps> = ({ onAuthTrigger }) => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { isVisible } = useScrollHeader();
  const [session] = useAtom(sessionAtom);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  
  // Safe to use ticketGroups hook here as this component only renders when authenticated
  const { groups, isLoading: isLoadingGroups, fetchGroups } = useTicketGroups();
  
  // Navigation tracking ref
  const navigationStateRef = useRef({
    inProgress: false,
    initialFetchCompleted: false,
    initialFetchAttempted: false
  });

  // Ticket count calculation
  const unrevealedTicketCount = useMemo(() => {
    if (!Array.isArray(groups)) return 0;
    
    return groups.reduce((sum, group) => {
      if (!group || typeof group !== 'object') return sum;
      const unrevealed = typeof group.unrevealed_tickets === 'number'
        ? group.unrevealed_tickets : 0;
      return sum + unrevealed;
    }, 0);
  }, [groups]);

  // Ticket indicators
  const ticketIndicators = useMemo(() => ({
    unrevealedCount: unrevealedTicketCount,
    isLoading: isLoadingGroups,
    hasTickets: Array.isArray(groups) && groups.length > 0
  }), [unrevealedTicketCount, isLoadingGroups, groups]);

  // Initial data fetch
  useEffect(() => {
    // Skip if already attempted
    if (navigationStateRef.current.initialFetchAttempted) return;
    
    navigationStateRef.current.initialFetchAttempted = true;
    
    const initTimer = setTimeout(async () => {
      try {
        const result = await fetchGroups(true);
        navigationStateRef.current.initialFetchCompleted = 
          Array.isArray(result) && result.length > 0;
      } catch (err) {
        console.error('Failed to fetch ticket data:', err);
      }
    }, 300);
    
    return () => clearTimeout(initTimer);
  }, [fetchGroups]);

  // Periodic refresh
  useEffect(() => {
    const refreshInterval = setInterval(() => {
      if (!navigationStateRef.current.inProgress) {
        fetchGroups().catch(err => {
          console.warn('Background ticket refresh failed:', err);
        });
      }
    }, 120000);
    
    return () => clearInterval(refreshInterval);
  }, [fetchGroups]);

  // Navigation handler
  const handleTicketsClick = useCallback(() => {
    if (location.pathname === '/my-tix' || navigationStateRef.current.inProgress) {
      setIsMobileMenuOpen(false);
      return;
    }
    
    setIsNavigating(true);
    navigationStateRef.current.inProgress = true;
    setIsMobileMenuOpen(false);
    
    fetchGroups(true).catch(err => 
      console.warn('Prefetch failed during navigation:', err)
    );
    
    navigate('/my-tix');
    
    const navTimer = setTimeout(() => {
      setIsNavigating(false);
      navigationStateRef.current.inProgress = false;
    }, 500);
    
    return () => clearTimeout(navTimer);
  }, [navigate, location.pathname, fetchGroups]);

  // Logout handler
  const handleLogout = useCallback(async () => {
    try {
      await logout();
      setIsMobileMenuOpen(false);
      setIsNavigating(false);
      navigationStateRef.current.inProgress = false;
      navigationStateRef.current.initialFetchCompleted = false;
      navigationStateRef.current.initialFetchAttempted = false;
      navigate('/', { replace: true });
    } catch (error) {
      console.error('Logout error:', error);
    }
  }, [logout, navigate]);

  // Balance formatting
  const formattedBalance = useMemo(() => {
    const amount = session?.balance?.available_balance ?? 0;
    return amount.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }, [session?.balance?.available_balance]);

  return (
    <>
      <AnimatePresence mode="wait">
        <motion.header
          key="main-header"
          className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm shadow-sm transform transition-all duration-300 ease-in-out"
          initial={false}
          animate={{ y: isVisible ? 0 : '-100%' }}
        >
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              {/* Logo */}
              <Link 
                to="/" 
                className="flex items-center space-x-2 flex-shrink-0"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <Trophy className="h-8 w-8 text-indigo-600" />
                <span className="text-xl md:text-2xl font-bold text-indigo-600 truncate">
                  WildRandom
                </span>
              </Link>

              {/* Desktop Navigation */}
              <nav className="hidden md:flex items-center">
                <Link 
                  to="/" 
                  className="flex items-center space-x-1 text-gray-700 hover:text-indigo-600 px-4 py-2 rounded-lg"
                >
                  <Trophy size={18} />
                  <span>Raffles</span>
                </Link>
              </nav>

              {/* User Controls */}
              <div className="flex items-center space-x-3">
                {/* Ticket Button */}
                <button
                  onClick={handleTicketsClick}
                  disabled={isNavigating}
                  className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50"
                  aria-label="My Tickets"
                >
                  {isNavigating ? (
                    <Loader className="w-6 h-6 text-gray-400 animate-spin" />
                  ) : (
                    <>
                      <Ticket className="w-6 h-6 text-gray-700" />
                      
                      {/* Ticket Counter Indicator */}
                      {ticketIndicators.unrevealedCount > 0 && (
                        <motion.div
                          key="unrevealed-count"
                          initial={{ scale: 0.5, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center bg-indigo-600 text-white text-xs font-medium rounded-full transform-gpu"
                        >
                          {ticketIndicators.unrevealedCount > 99 ? '99+' : ticketIndicators.unrevealedCount}
                        </motion.div>
                      )}
                    </>
                  )}
                </button>

                {/* Balance Display - Desktop Only */}
                <div className="hidden md:flex items-center px-3 py-1 bg-white rounded-lg border border-gray-200">
                  <Wallet className="w-5 h-5 text-indigo-600 mr-2" />
                  <span className="font-medium text-gray-900">${formattedBalance}</span>
                </div>

                {/* User Avatar Button */}
                <button
                  onClick={() => setIsMobileMenuOpen(prev => !prev)}
                  className="flex items-center justify-center w-9 h-9 rounded-full bg-indigo-100 hover:bg-indigo-200 transition-colors"
                  aria-label="User Menu"
                  aria-expanded={isMobileMenuOpen}
                >
                  {user && user.first_name && user.last_name ? (
                    <span className="text-indigo-700 font-medium">
                      {`${user.first_name[0]}${user.last_name[0]}`}
                    </span>
                  ) : (
                    <User className="w-5 h-5 text-indigo-700" />
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* User Menu Dropdown */}
          <AnimatePresence mode="wait">
            {isMobileMenuOpen && (
              <motion.div
                key="user-menu"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="border-t border-gray-100 bg-gray-50 overflow-hidden absolute right-0 top-16 w-full max-w-[300px] shadow-lg z-50 rounded-b-lg"
              >
                <div className="p-4 space-y-4">
                  {/* User Info Card */}
                  <div className="flex items-center space-x-3 p-3 bg-white rounded-lg shadow-sm">
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center">
                      {user && user.first_name && user.last_name ? (
                        <span className="text-indigo-700 font-medium">
                          {`${user.first_name[0]}${user.last_name[0]}`}
                        </span>
                      ) : (
                        <User className="w-5 h-5 text-indigo-700" />
                      )}
                    </div>
                    <div className="overflow-hidden">
                      <div className="font-medium text-gray-900 truncate">
                        {user?.username}
                      </div>
                      <div className="text-sm text-gray-500 truncate">
                        {user?.email}
                      </div>
                    </div>
                  </div>
                  
                  {/* Balance Display Card */}
                  <div className="flex items-center justify-between p-3 bg-indigo-50 rounded-lg shadow-sm">
                    <div className="flex items-center space-x-2">
                      <Wallet className="w-5 h-5 text-indigo-600" />
                      <span className="text-sm text-gray-700">Available Balance</span>
                    </div>
                    <span className="text-lg font-semibold text-indigo-700">
                      ${formattedBalance}
                    </span>
                  </div>
                  
                  {/* Menu Links */}
                  <div className="space-y-2 pt-2">
                    <Link
                      to="/my-tix"
                      className="flex items-center space-x-2 p-3 w-full text-left rounded-lg bg-white shadow-sm hover:bg-indigo-50"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <Ticket className="w-5 h-5 text-gray-500" />
                      <span className="text-gray-700">My Tickets</span>
                      
                      {/* Ticket indicator in menu */}
                      {ticketIndicators.unrevealedCount > 0 && (
                        <span className="ml-auto bg-indigo-600 text-white text-xs px-2 py-1 rounded-full">
                          {ticketIndicators.unrevealedCount}
                        </span>
                      )}
                    </Link>
                    
                    {/* Sign Out Button */}
                    <Button
                      variant="secondary"
                      onClick={handleLogout}
                      className="w-full justify-center mt-2"
                    >
                      <LogOut size={16} className="mr-2" />
                      Sign Out
                    </Button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.header>
      </AnimatePresence>

      {/* Content Spacer */}
      <div className="h-16" />
    </>
  );
};

export default Header;