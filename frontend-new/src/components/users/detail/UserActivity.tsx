import React from 'react';
import { ActivityIcon } from '../shared/ActivityIcon';
import { Card } from '@/components/ui/card';
import { useActivityStore } from '@/stores/userActivityStore';
import type { UserActivity as ActivityType, ActivityType as ActivityTypeEnum } from '@/types/users';
import { formatDate } from '@/utils/date';
import { cn } from '@/lib/utils';

interface UserActivityProps {
  userId: number;
  className?: string;
}

interface TimelineItemProps {
  activity: ActivityType;
}

interface ActivityDetails {
  title: string;
  description: string;
}

const TimelineItem: React.FC<TimelineItemProps> = ({ activity }) => {
  // Format activity details for display
  const getActivityDetails = (): ActivityDetails => {
    const details = activity.details || {};
    
    switch (activity.activity_type) {
      case 'login':
        return {
          title: 'User Login',
          description: `Logged in ${details.success ? 'successfully' : 'failed'}`
        };
      case 'logout':
        return {
          title: 'User Logout',
          description: 'User session ended'
        };
      case 'profile_update':
        return {
          title: 'Profile Updated',
          description: `Updated fields: ${
            Array.isArray(details.updated_fields)
              ? details.updated_fields.join(', ')
              : 'profile information'
          }`
        };
      case 'password_change':
        return {
          title: 'Password Changed',
          description: 'Security credentials updated'
        };
      case 'status_change':
        return {
          title: 'Status Changed',
          description: `Account ${details.new_status ? 'activated' : 'deactivated'}`
        };
      case 'email_verification':
        return {
          title: 'Email Verification',
          description: details.success 
            ? 'Email verified successfully' 
            : 'Email verification attempted'
        };
      case 'admin_login':
        return {
          title: 'Administrative Login',
          description: 'Logged in with administrative privileges'
        };
      case 'account_deletion':
        return {
          title: 'Account Deletion',
          description: 'Account deletion processed'
        };
      default: {
        // Type guard to ensure we have a string for unknown activity types
        const activityType = activity.activity_type as string;
        return {
          title: activityType.split('_').map(word => 
            word.charAt(0).toUpperCase() + word.slice(1)
          ).join(' '),
          description: 'Activity details not available'
        };
      }
    }
  };

  const { title, description } = getActivityDetails();

  return (
    <div className="flex space-x-4">
      {/* Activity Icon */}
      <div className="flex-shrink-0">
        <ActivityIcon
          type={activity.activity_type}
          size="md"
          showBackground
        />
      </div>

      {/* Activity Content */}
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-gray-900">
          {title}
        </div>
        <div className="mt-0.5 text-sm text-gray-500">
          {description}
        </div>
        {/* Technical Details (IP, User Agent) - Only shown if available */}
        {(activity.ip_address || activity.user_agent) && (
          <div className="mt-1 text-xs text-gray-400">
            {activity.ip_address && (
              <span className="mr-3">IP: {activity.ip_address}</span>
            )}
            {activity.user_agent && (
              <span className="truncate">Agent: {activity.user_agent}</span>
            )}
          </div>
        )}
        {/* Timestamp */}
        <div className="mt-1 text-xs text-gray-400">
          {formatDate(activity.created_at)}
        </div>
      </div>

      {/* Status Indicator */}
      <div className="flex-shrink-0">
        <span className={cn(
          'inline-flex rounded-full px-2 py-1 text-xs font-medium',
          activity.status === 'success' && 'bg-green-50 text-green-700',
          activity.status === 'failed' && 'bg-red-50 text-red-700',
          activity.status === 'blocked' && 'bg-yellow-50 text-yellow-700'
        )}>
          {activity.status}
        </span>
      </div>
    </div>
  );
};

export const UserActivity: React.FC<UserActivityProps> = ({
  userId,
  className
}) => {
  const {
    activities,
    isLoading,
    error,
    fetchUserActivities
  } = useActivityStore();

  // Initial data fetch
  React.useEffect(() => {
    fetchUserActivities(userId);
  }, [userId, fetchUserActivities]);

  // Loading state
  if (isLoading && !activities.length) {
    return (
      <Card className="p-6">
        <div className="animate-pulse space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex space-x-4">
              <div className="h-10 w-10 bg-gray-200 rounded-full" />
              <div className="flex-1 space-y-2 py-1">
                <div className="h-4 bg-gray-200 rounded w-3/4" />
                <div className="h-4 bg-gray-200 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </Card>
    );
  }

  // Error state
  if (error) {
    return (
      <Card className="p-6">
        <div className="text-red-500">
          {error}
        </div>
      </Card>
    );
  }

  // Empty state
  if (!activities.length) {
    return (
      <Card className="p-6">
        <div className="text-center text-gray-500">
          No activity recorded for this user
        </div>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <div className="p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-6">
          Activity Timeline
        </h3>
        <div className="space-y-8">
          {activities.map((activity) => (
            <TimelineItem
              key={activity.id}
              activity={activity}
            />
          ))}
        </div>
      </div>
    </Card>
  );
};

export default UserActivity;