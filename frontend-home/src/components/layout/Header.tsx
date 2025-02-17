// src/components/layout/Header.tsx

import { FC, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useScrollHeader } from '../../hooks/useScrollHeader';
import { motion, AnimatePresence } from 'framer-motion';
import Button from '../common/Button';
import useAuth from '../../hooks/useAuth';
import { useAtom } from 'jotai';
import { sessionAtom } from '../../stores/session';
import {
  Menu,
  Wallet,
  User,
  LogOut,
  LogIn,
  Trophy
} from '../common/icons';

interface HeaderProps {
  onAuthTrigger: () => void;
}

/**
 * Header Component
 * 
 * Implements a responsive application header with:
 * - Real-time balance display from session state
 * - Authentication state management
 * - Responsive design patterns
 * - Scroll-aware behavior
 */
const Header: FC<HeaderProps> = ({ onAuthTrigger }) => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const { isVisible } = useScrollHeader();
  const [session] = useAtom(sessionAtom);

  // Format balance for display with proper type safety
  const balanceDisplay = useMemo(() => {
    if (!session.balance?.available_balance) {
      return '$0.00';
    }

    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(session.balance.available_balance);
  }, [session.balance?.available_balance]);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <AnimatePresence>
      <motion.header
        className={`
          fixed top-0 left-0 right-0 z-50 
          bg-white/95 backdrop-blur-panel shadow-sm
          transform transition-all duration-300 ease-in-out
        `}
        initial={false}
        animate={{
          y: isVisible ? 0 : '-100%'
        }}
        transition={{
          type: 'spring',
          stiffness: 300,
          damping: 30
        }}
      >
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo/Brand */}
            <Link to="/" className="flex items-center space-x-2">
              <Trophy className="h-8 w-8 text-indigo-600" />
              <span className="text-2xl font-bold text-indigo-600">
                WildRandom
              </span>
            </Link>

            {/* Navigation */}
            <nav className="hidden md:flex space-x-8">
              <Link 
                to="/" 
                className="flex items-center space-x-1 text-gray-700 hover:text-indigo-600"
              >
                <Trophy size={18} />
                <span>Featured Raffles</span>
              </Link>
              <Link 
                to="/how-it-works" 
                className="text-gray-700 hover:text-indigo-600"
              >
                How It Works
              </Link>
            </nav>

            {/* Auth Section */}
            <div className="flex items-center space-x-4">
              {isAuthenticated && user ? (
                <>
                  {/* Balance Display */}
                  <div className="hidden md:flex items-center space-x-2 px-3 py-1 bg-indigo-50 rounded-lg">
                    <Wallet size={18} className="text-indigo-600" />
                    <div>
                      <div className="text-sm text-gray-600">Balance</div>
                      <div className="font-semibold text-indigo-600">
                        {balanceDisplay}
                      </div>
                    </div>
                  </div>

                  {/* User Menu */}
                  <div className="relative flex items-center space-x-2">
                    <Link to="/profile">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        className="flex items-center space-x-2"
                      >
                        <User size={18} />
                        <span>{user.username}</span>
                      </Button>
                    </Link>
                    <Button 
                      variant="secondary" 
                      size="sm"
                      onClick={handleLogout}
                      className="flex items-center space-x-2"
                    >
                      <LogOut size={16} />
                      <span className="hidden sm:inline">Sign Out</span>
                    </Button>
                  </div>
                </>
              ) : (
                <Button
                  onClick={onAuthTrigger}
                  size="sm"
                  className="flex items-center space-x-2"
                >
                  <LogIn size={18} />
                  <span>Sign In</span>
                </Button>
              )}

              {/* Mobile Menu Button */}
              <button 
                className="md:hidden p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                aria-label="Open menu"
              >
                <Menu className="h-6 w-6" />
              </button>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Spacer to prevent content jump */}
      <div className="h-16" />
    </AnimatePresence>
  );
};

export default Header;