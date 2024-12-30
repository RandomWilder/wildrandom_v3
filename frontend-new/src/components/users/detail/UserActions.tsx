import React from 'react';
import { 
  UserCog,
  Ban,
  Mail,
  Trash2,
  Key,
  RefreshCw,
  AlertCircle,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { BaseUser } from '@/types/users';
import { cn } from '@/lib/utils';

interface UserActionsProps {
  user: BaseUser;
  className?: string;
}

interface Action {
  id: string;
  label: string | ((user: BaseUser) => string);
  description: string | ((user: BaseUser) => string);
  icon: React.ElementType;
  variant?: 'default' | 'destructive' | 'outline';
  showFor: (user: BaseUser) => boolean;
  dangerous?: boolean;
}

/**
 * Available administrative actions with conditional rendering logic
 * and type-safe execution patterns.
 */
const ACTIONS: Action[] = [
  {
    id: 'status_toggle',
    label: (user) => user.is_active ? 'Deactivate Account' : 'Activate Account',
    description: (user) => user.is_active 
      ? 'Prevent user from accessing the platform'
      : 'Allow user to access the platform',
    icon: Ban,
    variant: 'outline',
    showFor: (user) => !user.is_admin,
    dangerous: true
  },
  {
    id: 'resend_verification',
    label: 'Resend Verification',
    description: 'Send a new verification email to the user',
    icon: Mail,
    variant: 'outline',
    showFor: (user) => !user.is_verified
  },
  {
    id: 'reset_password',
    label: 'Reset Password',
    description: 'Send password reset instructions to user',
    icon: Key,
    variant: 'outline',
    showFor: (user) => user.auth_provider === 'local'
  },
  {
    id: 'sync_oauth',
    label: 'Sync OAuth Data',
    description: 'Synchronize data with OAuth provider',
    icon: RefreshCw,
    variant: 'outline',
    showFor: (user) => user.auth_provider === 'google'
  },
  {
    id: 'delete_account',
    label: 'Delete Account',
    description: 'Permanently delete user account and all associated data',
    icon: Trash2,
    variant: 'destructive',
    showFor: (user) => !user.is_admin,
    dangerous: true
  }
];

/**
 * UserActions Component
 * 
 * Provides administrative actions for user management with:
 * - Type-safe action handling
 * - Conditional action visibility
 * - Clear visual hierarchy for dangerous operations
 * - Comprehensive action context
 */
export const UserActions: React.FC<UserActionsProps> = ({
  user,
  className
}) => {
  // Filter available actions based on user state
  const availableActions = ACTIONS.filter(action => action.showFor(user));

  // Group actions by danger level
  const { safe, dangerous } = availableActions.reduce(
    (acc, action) => {
      if (action.dangerous) {
        acc.dangerous.push(action);
      } else {
        acc.safe.push(action);
      }
      return acc;
    },
    { safe: [] as Action[], dangerous: [] as Action[] }
  );

  // No actions available state
  if (!availableActions.length) {
    return (
      <Card className="p-6">
        <div className="flex items-center text-gray-500">
          <UserCog className="h-5 w-5 mr-2" />
          <span>No actions available for this user</span>
        </div>
      </Card>
    );
  }

  const handleAction = (actionId: string) => {
    // Action handling will be implemented as per business requirements
    console.log(`Executing action: ${actionId} for user: ${user.id}`);
  };

  return (
    <Card className={cn('divide-y', className)}>
      {/* Safe Actions */}
      <div className="p-6 space-y-6">
        <h3 className="text-lg font-medium text-gray-900">
          Account Management
        </h3>
        <div className="space-y-6">
          {safe.map(action => (
            <div key={action.id} className="flex items-start space-x-4">
              <div className="rounded-full p-2 bg-gray-50">
                <action.icon className="h-5 w-5 text-gray-500" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-medium text-gray-900">
                  {typeof action.label === 'function' ? action.label(user) : action.label}
                </h4>
                <p className="mt-1 text-sm text-gray-500">
                  {typeof action.description === 'function' ? action.description(user) : action.description}
                </p>
              </div>
              <Button
                variant={action.variant || 'default'}
                size="sm"
                onClick={() => handleAction(action.id)}
              >
                Execute
              </Button>
            </div>
          ))}
        </div>
      </div>

      {/* Dangerous Actions */}
      {dangerous.length > 0 && (
        <div className="p-6 space-y-6">
          <div className="flex items-center space-x-2">
            <AlertCircle className="h-5 w-5 text-red-500" />
            <h3 className="text-lg font-medium text-red-900">
              Danger Zone
            </h3>
          </div>
          <div className="space-y-6">
            {dangerous.map(action => (
              <div key={action.id} className="flex items-start space-x-4">
                <div className="rounded-full p-2 bg-red-50">
                  <action.icon className="h-5 w-5 text-red-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-medium text-red-900">
                    {typeof action.label === 'function' ? action.label(user) : action.label}
                  </h4>
                  <p className="mt-1 text-sm text-red-600">
                    {typeof action.description === 'function' ? action.description(user) : action.description}
                  </p>
                </div>
                <Button
                  variant={action.variant || 'destructive'}
                  size="sm"
                  onClick={() => handleAction(action.id)}
                >
                  Execute
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
};

export default UserActions;