 
/**
 * Main Navigation Component
 * 
 * Orchestrates gameplay navigation with:
 * - Optimized route transitions
 * - Active state indicators
 * - Progress persistence
 * - Mobile-responsive layout
 */

import { FC, useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Trophy, Ticket, User } from 'lucide-react';
import { useAtom } from 'jotai';
import { persistedTicketStateAtom } from '../../stores/tickets';

// Navigation configuration for gameplay flow
const NAV_ITEMS = [
  {
    path: '/',
    label: 'Featured Raffles',
    icon: Trophy,
    description: 'Explore active prize pools'
  },
  {
    path: '/tickets',
    label: 'My Tickets',
    icon: Ticket,
    description: 'View and reveal your tickets'
  },
  {
    path: '/profile',
    label: 'Profile',
    icon: User,
    description: 'Manage your account'
  }
];

interface NavigationProps {
  className?: string;
}

const Navigation: FC<NavigationProps> = ({ className = '' }) => {
  const location = useLocation();
  const [ticketState] = useAtom(persistedTicketStateAtom);

  // Compute notification indicators
  const notifications = useMemo(() => {
    const unrevealedCount = Object.values(ticketState.groups)
      .flatMap(group => group.tickets)
      .filter(ticket => !ticket.reveal_time).length;

    return {
      tickets: unrevealedCount
    };
  }, [ticketState.groups]);

  return (
    <nav className={`px-2 ${className}`}>
      <ul className="flex items-center space-x-1">
        {NAV_ITEMS.map(({ path, label, icon: Icon, description }) => {
          const isActive = location.pathname === path;
          const hasNotification = path === '/tickets' && notifications.tickets > 0;

          return (
            <li key={path}>
              <Link
                to={path}
                className="relative group px-3 py-2 rounded-lg 
                         text-gray-700 hover:bg-gray-100
                         transition-colors duration-150"
                aria-label={description}
              >
                <div className="flex items-center space-x-2">
                  <Icon 
                    className={`w-5 h-5 ${isActive ? 'text-indigo-600' : 'text-gray-400 group-hover:text-gray-600'}`}
                  />
                  <span className={`${isActive ? 'font-medium text-indigo-600' : ''}`}>
                    {label}
                  </span>
                </div>

                {/* Notification Badge */}
                {hasNotification && (
                  <motion.div
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="absolute -top-1 -right-1 flex items-center justify-center
                             w-5 h-5 bg-indigo-600 text-white text-xs font-medium
                             rounded-full transform-gpu"
                  >
                    {notifications.tickets}
                  </motion.div>
                )}

                {/* Active Indicator */}
                {isActive && (
                  <motion.div
                    layoutId="activeNav"
                    className="absolute inset-0 bg-gray-100 rounded-lg -z-10"
                    transition={{
                      type: "spring",
                      stiffness: 500,
                      damping: 30
                    }}
                  />
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
};

export default Navigation;