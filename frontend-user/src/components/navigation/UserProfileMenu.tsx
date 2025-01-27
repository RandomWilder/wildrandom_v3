// src/components/navigation/UserProfileMenu.tsx
import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/router';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Settings, LogOut, ChevronDown } from 'lucide-react';
import { AuthService } from '@/lib/auth';

export const UserProfileMenu: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    try {
      await AuthService.logout();
      router.push('/auth/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 p-2 rounded-lg hover:bg-surface-hover 
                 transition-colors duration-200 ease-gaming"
      >
        <div className="w-8 h-8 rounded-full bg-game-500/20 flex items-center justify-center">
          <User className="w-5 h-5 text-game-500" />
        </div>
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-200 
          ${isOpen ? 'transform rotate-180' : ''}`} 
        />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            transition={{ duration: 0.2 }}
            className="absolute right-0 mt-2 w-48 bg-surface-card rounded-lg shadow-lg 
                     border border-gray-800 overflow-hidden z-50"
          >
            <div className="py-1">
              <button
                onClick={() => router.push('/profile')}
                className="w-full px-4 py-2 text-sm text-gray-300 hover:bg-surface-hover
                         flex items-center space-x-2 transition-colors duration-200"
              >
                <Settings className="w-4 h-4" />
                <span>Settings</span>
              </button>
              
              <button
                onClick={handleLogout}
                className="w-full px-4 py-2 text-sm text-accent-error hover:bg-surface-hover
                         flex items-center space-x-2 transition-colors duration-200"
              >
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};