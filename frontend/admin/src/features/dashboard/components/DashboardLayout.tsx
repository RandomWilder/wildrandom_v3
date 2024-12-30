import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuthStore } from '@/features/auth/store/AuthStore';
import { useDashboardStore } from '../store/dashboard-store';
import { 
  LayoutGrid, Trophy, Users, BarChart4, 
  Settings, LogOut, Gift, Bell, Activity
} from 'lucide-react';

const navigation = [
  { name: 'Dashboard', icon: LayoutGrid, href: '/admin/dashboard' },
  { name: 'Prizes', icon: Trophy, href: '/admin/prizes/templates' },  // Updated path
  { name: 'Raffles', icon: Gift, href: '/admin/raffles' },
  { name: 'Users', icon: Users, href: '/admin/users' },
  { name: 'Analytics', icon: BarChart4, href: '/admin/analytics' },
];

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const logout = useAuthStore(state => state.logout);
  const user = useAuthStore(state => state.user);
  const [isNavigating, setIsNavigating] = useState(false);
  const { metrics, isLoading } = useDashboardStore();

  const handleNavigation = async (href: string) => {
    setIsNavigating(true);
    try {
      await router.push(href);
    } finally {
      setIsNavigating(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      router.push('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <div className="min-h-screen bg-[#F9FAFB]">
      <div className="flex">
        {/* Sidebar */}
        <div className="w-64 bg-white border-r border-gray-200 min-h-screen">
          <div className="flex flex-col h-full">
            {/* Logo */}
            <div className="p-4">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-[#4F46E5] to-[#10B981] text-transparent bg-clip-text">
                WildRandom
              </h1>
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-4 space-y-1">
              {navigation.map((item) => (
                <button
                  key={item.name}
                  onClick={() => handleNavigation(item.href)}
                  className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                    router.pathname === item.href
                      ? 'bg-indigo-50 text-indigo-600'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <item.icon className="mr-3 h-5 w-5" />
                  {item.name}
                </button>
              ))}
            </nav>

            {/* User section */}
            <div className="p-4 border-t border-gray-200">
              <button
                onClick={handleLogout}
                className="w-full flex items-center px-4 py-3 text-sm font-medium text-gray-600 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <LogOut className="mr-3 h-5 w-5" />
                Sign out
              </button>
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1">
          <div className="p-8">
            {isLoading ? (
              <div className="animate-pulse">Loading...</div>
            ) : (
              children
            )}
          </div>
        </div>
      </div>
    </div>
  );
}