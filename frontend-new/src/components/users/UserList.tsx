import React from 'react';
import { LayoutGrid, List } from 'lucide-react';
import { useRouter } from 'next/router';
import { useUserStore } from '@/stores/userStore';
import { UserListHeader } from './UserListHeader';
import { UserListFilters } from './UserListFilters';
import { UserListTable } from './UserListTable';
import { UserListGrid } from './UserListGrid';
import type { BaseUser } from '@/types/users';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

// View mode type and local storage key
type ViewMode = 'grid' | 'table';
const VIEW_MODE_STORAGE_KEY = 'user-list-view-mode';

interface UserListProps {
  className?: string;
}

/**
 * Main User List Component
 * Orchestrates the user management interface and handles business operations
 */
export const UserList: React.FC<UserListProps> = ({ className }) => {
  const router = useRouter();
  const {
    users,
    isLoading,
    error,
    fetchUsers,
    updateUserStatus,
    verifyUser
  } = useUserStore();

  // View mode state with persistence
  const [viewMode, setViewMode] = React.useState<ViewMode>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem(VIEW_MODE_STORAGE_KEY) as ViewMode) || 'table';
    }
    return 'table';
  });

  // Persist view mode changes
  React.useEffect(() => {
    localStorage.setItem(VIEW_MODE_STORAGE_KEY, viewMode);
  }, [viewMode]);

  // Initial data fetch
  React.useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  /**
   * User Action Handlers
   */
  const handleUserClick = React.useCallback((user: BaseUser) => {
    router.push(`/admin/users/${user.id}`);
  }, [router]);

  const handleCreateUser = React.useCallback(() => {
    router.push('/admin/users/create');
  }, [router]);

  const handleUserAction = React.useCallback(async (action: string, user: BaseUser) => {
    try {
      switch (action) {
        case 'edit':
          router.push(`/admin/users/${user.id}/edit`);
          break;

        case 'status':
          await updateUserStatus(user.id, {
            is_active: !user.is_active,
            reason: `User ${user.is_active ? 'deactivated' : 'activated'} by admin`
          });
          break;

        case 'verify':
          await verifyUser(user.id);
          break;

        case 'delete':
          // Implement delete confirmation dialog
          break;

        default:
          console.warn(`Unhandled user action: ${action}`);
      }
    } catch (error) {
      // Error handling should be managed by the store
      console.error('Action failed:', error);
    }
  }, [router, updateUserStatus, verifyUser]);

  /**
   * Export/Import Handlers
   */
  const handleExport = React.useCallback(() => {
    // Implement export functionality
    console.log('Export functionality to be implemented');
  }, []);

  const handleImport = React.useCallback(() => {
    // Implement import functionality
    console.log('Import functionality to be implemented');
  }, []);

  /**
   * View Mode Toggle Component
   */
  const ViewToggle: React.FC = () => (
    <div className="flex items-center gap-2 ml-4">
      <Button
        variant="outline"
        size="sm"
        onClick={() => setViewMode('grid')}
        className={cn(
          viewMode === 'grid' && 'bg-gray-100'
        )}
      >
        <LayoutGrid className="h-4 w-4" />
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setViewMode('table')}
        className={cn(
          viewMode === 'table' && 'bg-gray-100'
        )}
      >
        <List className="h-4 w-4" />
      </Button>
    </div>
  );

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header Section */}
      <div className="flex items-start justify-between">
        <UserListHeader
          onCreateUser={handleCreateUser}
          onExport={handleExport}
          onImport={handleImport}
        />
        <ViewToggle />
      </div>

      {/* Filters Section */}
      <div className="flex justify-end">
        <UserListFilters />
      </div>

      {/* Main Content */}
      <div className="mt-6">
        {viewMode === 'table' ? (
          <UserListTable
            onUserClick={handleUserClick}
            onUserAction={handleUserAction}
          />
        ) : (
          <UserListGrid
            onUserClick={handleUserClick}
            onUserAction={handleUserAction}
          />
        )}
      </div>

      {/* Error Display */}
      {error && (
        <div className="rounded-lg bg-red-50 p-4 mt-4">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}
    </div>
  );
};

export default UserList;