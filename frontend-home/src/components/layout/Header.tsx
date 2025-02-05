import { FC } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Button from '../common/Button';
import useAuth from '../../hooks/useAuth';
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

const Header: FC<HeaderProps> = ({ onAuthTrigger }) => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <header className="bg-white shadow-sm">
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
            <Link to="/" className="flex items-center space-x-1 text-gray-700 hover:text-indigo-600">
              <Trophy size={18} />
              <span>Featured Raffles</span>
            </Link>
            <Link to="/how-it-works" className="text-gray-700 hover:text-indigo-600">
              How It Works
            </Link>
          </nav>

          {/* Auth Section */}
          <div className="flex items-center space-x-4">
            {isAuthenticated && user ? (
              <>
                {/* User Balance */}
                <div className="hidden md:flex items-center space-x-2 px-3 py-1 bg-indigo-50 rounded-lg">
                  <Wallet size={18} className="text-indigo-600" />
                  <div>
                    <div className="text-sm text-gray-600">Balance</div>
                    <div className="font-semibold text-indigo-600">
                      ${user.balance.available.toFixed(2)}
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
            <button className="md:hidden p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100">
              <Menu className="h-6 w-6" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;