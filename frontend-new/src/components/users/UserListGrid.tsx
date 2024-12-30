import React from 'react';
import { 
  MoreVertical, 
  UserCog,
  Ban,
  Mail,
  Trash2,
  Clock,
  LucideIcon,
  Calendar
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { useUserStore } from '@/stores/userStore';
import { UserStatusBadge } from './shared/UserStatusBadge';
import { UserRoleBadge } from './shared/UserRoleBadge';
import { UserAvatar } from './shared/UserAvatar';
import type { BaseUser } from '@/types/users';
import { formatDate } from '@/utils/date';
import { cn } from '@/lib/utils';

interface UserListGridProps {
  onUserClick?: (user: BaseUser) => void;
  onUserAction?: (action: string, user: BaseUser) => void;
  className?: string;
}

interface UserAction {
  id: string;
  label: string | ((user: BaseUser) => string);
  icon: LucideIcon;
  showFor: (user: BaseUser) => boolean;
  danger?: boolean;
}

// Action configurations (shared with table view)
const USER_ACTIONS: UserAction[] = [
  {
    id: 'edit',
    label: 'Edit User',
    icon: UserCog,
    showFor: () => true
  },
  {
    id: 'status',
    label: (user: BaseUser) => user.is_active ? 'Deactivate User' : 'Activate User',
    icon: Ban,
    showFor: (user: BaseUser) => !user.is_admin
  },
  {
    id: 'verify',
    label: 'Send Verification',
    icon: Mail,
    showFor: (user: BaseUser) => !user.is_verified
  },
  {
    id: 'delete',
    label: 'Delete User',
    icon: Trash2,
    showFor: (user: BaseUser) => !user.is_admin,
    danger: true
  }
];

/**
 * User Card Component
 * Displays individual user information in grid format
 */
const UserCard: React.FC<{
  user: BaseUser;
  onClick?: () => void;
  onAction?: (action: string) => void;
}> = ({ user, onClick, onAction }) => (
  <Card
    className="hover:shadow-md transition-shadow cursor-pointer overflow-hidden"
    onClick={onClick}
  >
    <div className="p-6 space-y-4">
      {/* Header with Avatar and Actions */}
      <div className="flex items-start justify-between">
        <UserAvatar
          firstName={user.first_name}
          lastName={user.last_name}
          email={user.email}
          size="lg"
        />
        <div className="relative group">
          <button
            onClick={(e) => {
              e.stopPropagation();
              // Toggle action menu
            }}
            className="text-gray-400 hover:text-gray-900"
          >
            <MoreVertical className="h-5 w-5" />
          </button>
          
          {/* Action Menu */}
          <div className="hidden group-hover:block absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-10">
            <div className="py-1" role="menu">
              {USER_ACTIONS.filter(action => action.showFor(user)).map(action => (
                <button
                  key={action.id}
                  className={`
                    w-full px-4 py-2 text-sm text-left flex items-center space-x-2
                    ${action.danger ? 'text-red-600 hover:bg-red-50' : 'text-gray-700 hover:bg-gray-50'}
                  `}
                  onClick={(e) => {
                    e.stopPropagation();
                    onAction?.(action.id);
                  }}
                  role="menuitem"
                >
                  <action.icon className="h-4 w-4" />
                  <span>
                    {typeof action.label === 'function' ? action.label(user) : action.label}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* User Information */}
      <div className="space-y-2">
        <div>
          <h3 className="text-lg font-medium text-gray-900">{user.username}</h3>
          <p className="text-sm text-gray-500">{user.email}</p>
        </div>

        {/* Status and Role */}
        <div className="flex flex-wrap gap-2">
          <UserStatusBadge
            isActive={user.is_active}
            isVerified={user.is_verified}
            isAdmin={user.is_admin}
          />
          <UserRoleBadge
            role={user.is_admin ? 'admin' : 'user'}
            showIcon={true}
          />
        </div>

        {/* Timestamps */}
        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-100">
          <div className="flex items-center text-sm text-gray-500">
            <Calendar className="h-4 w-4 mr-1.5" />
            <span>Created: {formatDate(user.created_at)}</span>
          </div>
          <div className="flex items-center text-sm text-gray-500">
            <Clock className="h-4 w-4 mr-1.5" />
            <span>
              {user.last_login ? `Last Login: ${formatDate(user.last_login)}` : 'Never logged in'}
            </span>
          </div>
        </div>
      </div>
    </div>
  </Card>
);

/**
 * User List Grid Component
 */
export const UserListGrid: React.FC<UserListGridProps> = ({
  onUserClick,
  onUserAction,
  className
}) => {
  const { users, isLoading, error } = useUserStore();

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="text-center text-gray-500">Loading users...</div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="text-center text-red-500">{error}</div>
      </div>
    );
  }

  // Empty state
  if (!users.length) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="text-center text-gray-500">No users found</div>
      </div>
    );
  }

  return (
    <div className={cn('grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3', className)}>
      {users.map((user) => (
        <UserCard
          key={user.id}
          user={user}
          onClick={() => onUserClick?.(user)}
          onAction={(action) => onUserAction?.(action, user)}
        />
      ))}
    </div>
  );
};

export default UserListGrid;