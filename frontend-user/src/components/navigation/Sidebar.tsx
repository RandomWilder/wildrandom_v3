// src/components/navigation/Sidebar.tsx
import React from 'react';
import { useRouter } from 'next/router';
import { Home, Ticket, Trophy, User, Gamepad2 } from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
}

const NAVIGATION_ITEMS = [
  { icon: Home, label: 'Home', href: '/' },
  { icon: Ticket, label: 'My Tickets', href: '/tickets' },
  { icon: Trophy, label: 'My Wins', href: '/wins' },
  { icon: User, label: 'Profile', href: '/profile' },
  { icon: Gamepad2, label: 'Games', href: '/games' }
];

export const Sidebar: React.FC<SidebarProps> = ({ isOpen }) => {
  const router = useRouter();

  return (
    <aside className={`
      fixed left-0 top-0 bottom-0 z-30
      w-64 bg-surface-dark border-r border-gray-800
      transform transition-transform duration-200 ease-gaming
      ${isOpen ? 'translate-x-0' : '-translate-x-full'}
    `}>
      <div className="p-4">
        <div className="mb-8">
          <h2 className="text-lg font-bold text-white">Navigation</h2>
        </div>

        <nav className="space-y-1">
          {NAVIGATION_ITEMS.map((item) => (
            <button
              key={item.label}
              onClick={() => router.push(item.href)}
              className={`
                w-full flex items-center space-x-3 px-4 py-3 rounded-lg
                ${router.pathname === item.href ? 
                  'bg-game-500/20 text-game-400' : 
                  'text-gray-400 hover:bg-surface-hover'
                }
                transition-all duration-200 ease-gaming
                hover:translate-x-1
              `}
            >
              <item.icon className="w-5 h-5" />
              <span>{item.label}</span>
            </button>
          ))}
        </nav>
      </div>
    </aside>
  );
};