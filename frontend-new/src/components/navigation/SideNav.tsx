import { useRouter } from 'next/router';
import { LogOut } from 'lucide-react';
import { ADMIN_NAVIGATION } from '@/config/navigation';
import { useAuthStore } from '@/stores/auth-store';
import { NavItem } from './NavItem';

export function SideNav() {
  const router = useRouter();
  const { user, logout } = useAuthStore();

  const handleLogout = async () => {
    await logout();
    router.push('/admin/login');
  };

  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="p-4 border-b border-gray-200">
        <h1 className="text-xl font-bold">
          <span className="text-indigo-600">WildRandom</span>
        </h1>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 py-4 overflow-y-auto">
        {ADMIN_NAVIGATION.map((item) => (
          <NavItem key={item.path} item={item} />
        ))}
      </nav>

      {/* User section */}
      {user && (
        <div className="border-t border-gray-200 p-4">
          <div className="mb-4 px-4 py-2 rounded-lg bg-gray-50">
            <p className="text-sm font-medium text-gray-900">{user.username}</p>
            <p className="text-xs text-gray-500">{user.email}</p>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center px-4 py-2 text-sm font-medium 
                     text-red-600 rounded-lg hover:bg-red-50 transition-colors"
          >
            <LogOut className="mr-3 h-5 w-5" />
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}