// frontend/admin/src/features/raffles/components/RafflesLayout.tsx

import { useRouter } from 'next/router';
import { DashboardLayout } from '@/features/dashboard/components/DashboardLayout';
import { Trophy, Package, Timer, Plus } from 'lucide-react';

interface RafflesLayoutProps {
  children: React.ReactNode;
  activeTab?: 'raffles' | 'templates' | 'pools';
}

export function RafflesLayout({ children, activeTab = 'raffles' }: RafflesLayoutProps) {
  const router = useRouter();

  const navItems = [
    { key: 'raffles', label: 'Raffles', href: '/admin/raffles', icon: Trophy },
    { key: 'templates', label: 'Prize Templates', href: '/admin/raffles/templates', icon: Package },
    { key: 'pools', label: 'Prize Pools', href: '/admin/raffles/pools', icon: Timer }
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Raffle Management</h1>
            <p className="mt-1 text-sm text-gray-600">
              Create and manage your gaming raffles, prize pools, and templates
            </p>
          </div>
          <button
            onClick={() => {
              switch(activeTab) {
                case 'templates':
                  router.push('/admin/prizes/templates/create');
                  break;
                case 'pools':
                  router.push('/admin/raffles/pools/create');
                  break;
                default:
                  router.push('/admin/raffles/create');
              }
            }}
            className="inline-flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 
                     text-white rounded-lg transition-colors shadow-sm hover:shadow-md"
          >
            <Plus className="w-5 h-5 mr-2" />
            {`New ${activeTab.charAt(0).toUpperCase() + activeTab.slice(1, -1)}`}
          </button>
        </div>

        {/* Navigation Tabs */}
        <nav className="border-b border-gray-200 -mb-px">
          <div className="flex space-x-8">
            {navItems.map((item) => (
              <button
                key={item.key}
                onClick={() => router.push(item.href)}
                className={`group inline-flex items-center px-1 py-4 border-b-2 font-medium text-sm
                  ${activeTab === item.key
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
              >
                <item.icon className={`mr-3 h-5 w-5
                  ${activeTab === item.key
                    ? 'text-indigo-500'
                    : 'text-gray-400 group-hover:text-gray-500'
                  }`}
                />
                {item.label}
              </button>
            ))}
          </div>
        </nav>

        {/* Main Content */}
        <div className="mt-6">
          {children}
        </div>
      </div>
    </DashboardLayout>
  );
}