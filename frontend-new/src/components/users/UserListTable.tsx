import React from 'react';
import { 
  ArrowUp, 
  ArrowDown, 
  MoreVertical,
  UserCog,
  Ban,
  Mail,
  Trash2,
  LucideIcon
} from 'lucide-react';
import { useUserStore } from '@/stores/userStore';
import { UserStatusBadge } from './shared/UserStatusBadge';
import { UserRoleBadge } from './shared/UserRoleBadge';
import { UserAvatar } from './shared/UserAvatar';
import type { BaseUser } from '@/types/users';
import { formatDate } from '@/utils/date';

// Column configuration with type safety
interface ColumnDef<T> {
  field: keyof T | string;
  label: string;
  sortable?: boolean;
  align?: 'left' | 'right' | 'center';
  width?: string;
  render?: (row: T) => React.ReactNode;
}

interface UserListTableProps {
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

// Action configurations
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
] as const;

// Column definitions
const COLUMNS: ColumnDef<BaseUser>[] = [
  {
    field: 'avatar',
    label: '',
    width: '48px',
    render: (user) => (
      <UserAvatar
        firstName={user.first_name}
        lastName={user.last_name}
        email={user.email}
        size="sm"
      />
    )
  },
  {
    field: 'username',
    label: 'User',
    sortable: true,
    render: (user) => (
      <div className="flex flex-col">
        <span className="font-medium text-gray-900">{user.username}</span>
        <span className="text-sm text-gray-500">{user.email}</span>
      </div>
    )
  },
  {
    field: 'status',
    label: 'Status',
    sortable: true,
    render: (user) => (
      <UserStatusBadge
        isActive={user.is_active}
        isVerified={user.is_verified}
        isAdmin={user.is_admin}
      />
    )
  },
  {
    field: 'role',
    label: 'Role',
    render: (user) => (
      <UserRoleBadge
        role={user.is_admin ? 'admin' : 'user'}
        showIcon={true}
      />
    )
  },
  {
    field: 'created_at',
    label: 'Created',
    sortable: true,
    align: 'right',
    render: (user) => formatDate(user.created_at)
  },
  {
    field: 'last_login',
    label: 'Last Login',
    sortable: true,
    align: 'right',
    render: (user) => user.last_login ? formatDate(user.last_login) : 'Never'
  }
];

export const UserListTable: React.FC<UserListTableProps> = ({
  onUserClick,
  onUserAction,
  className
}) => {
  const { users, isLoading, error } = useUserStore();
  const [sortConfig, setSortConfig] = React.useState<{
    field: keyof BaseUser;
    direction: 'asc' | 'desc';
  }>({ field: 'created_at', direction: 'desc' });

  // Handle sort
  const handleSort = (field: keyof BaseUser) => {
    setSortConfig(current => ({
      field,
      direction: current.field === field && current.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  // Handle action menu
  const handleAction = (action: string, user: BaseUser) => {
    onUserAction?.(action, user);
  };

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
    <div className="overflow-x-auto rounded-lg border border-gray-200">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            {COLUMNS.map((column) => (
              <th
                key={column.field}
                scope="col"
                className={`
                  px-6 py-3 text-${column.align || 'left'}
                  text-xs font-medium text-gray-500 uppercase tracking-wider
                  ${column.width ? `w-[${column.width}]` : ''}
                  ${column.sortable ? 'cursor-pointer' : ''}
                `}
                onClick={() => column.sortable && handleSort(column.field as keyof BaseUser)}
              >
                <div className="flex items-center space-x-1 justify-between">
                  <span>{column.label}</span>
                  {column.sortable && sortConfig.field === column.field && (
                    sortConfig.direction === 'asc' 
                      ? <ArrowUp className="h-4 w-4" />
                      : <ArrowDown className="h-4 w-4" />
                  )}
                </div>
              </th>
            ))}
            <th scope="col" className="relative px-6 py-3">
              <span className="sr-only">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {users.map((user) => (
            <tr
              key={user.id}
              className="hover:bg-gray-50 cursor-pointer"
              onClick={() => onUserClick?.(user)}
            >
              {COLUMNS.map((column) => (
                <td
                  key={column.field}
                  className={`
                    px-6 py-4 whitespace-nowrap text-sm
                    ${column.align === 'right' ? 'text-right' : ''}
                  `}
                >
                  {column.render ? column.render(user) : String(user[column.field as keyof BaseUser])}
                </td>
              ))}
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
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
                  
                  {/* Action Menu - To be implemented based on UI library choice */}
                  <div className="hidden group-hover:block absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5">
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
                            handleAction(action.id, user);
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
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default UserListTable;