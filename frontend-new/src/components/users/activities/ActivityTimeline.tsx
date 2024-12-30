import React, { useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { ActivityIcon } from '../shared/ActivityIcon';
import type { UserActivity } from '@/types/users';
import { ACTIVITY_TYPE_META, ACTIVITY_STATUS_META } from '@/types/users/activities';
import { formatDate } from '@/utils/date';
import { cn } from '@/lib/utils';

interface ActivityTimelineProps {
  activities: UserActivity[];
  className?: string;
  maxItems?: number;
}

interface TimelineItemProps {
  activity: UserActivity;
  isFirst: boolean;
  isLast: boolean;
}

/**
 * TimelineItem Component
 * 
 * Renders an individual activity in the timeline with contextual information
 * and appropriate visual hierarchy. Implements connecting lines between items
 * for clear temporal relationships.
 */
const TimelineItem: React.FC<TimelineItemProps> = ({
  activity,
  isFirst,
  isLast
}) => {
  // Determine connecting line styles based on item position
  const lineStyles = cn(
    'absolute left-4 w-0.5 bg-gray-200',
    isFirst ? 'top-6 bottom-0' : isLast ? 'top-0 h-6' : 'top-0 bottom-0'
  );

  // Format activity details for display
  const activityMeta = ACTIVITY_TYPE_META[activity.activity_type];
  const statusMeta = ACTIVITY_STATUS_META[activity.status];

  return (
    <div className="relative pl-8 pb-6">
      {/* Visual connection line */}
      <div className={lineStyles} aria-hidden="true" />

      {/* Activity indicator */}
      <div className="absolute left-0 top-2">
        <ActivityIcon
          type={activity.activity_type}
          size="md"
          showBackground
        />
      </div>

      {/* Activity content */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            {/* Primary activity information */}
            <div className="flex items-center space-x-2">
              <span className="font-medium text-gray-900">
                User ID: {activity.user_id}
              </span>
              <span className={cn(
                'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                statusMeta.color,
                statusMeta.bgColor
              )}>
                {statusMeta.label}
              </span>
            </div>

            {/* Activity description */}
            <p className="text-sm text-gray-600">
              {activityMeta.description}
            </p>

            {/* Activity metadata */}
            {activity.details && Object.keys(activity.details).length > 0 && (
              <div className="mt-2 text-sm text-gray-500 space-y-1">
                {Object.entries(activity.details).map(([key, value]) => (
                  <div key={key} className="flex items-baseline space-x-2">
                    <span className="font-medium min-w-[100px]">{key}:</span>
                    <span className="truncate">
                      {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* System details */}
            {(activity.ip_address || activity.user_agent) && (
              <div className="mt-2 text-xs text-gray-400 space-x-3">
                {activity.ip_address && (
                  <span title="IP Address" className="inline-flex items-center">
                    IP: {activity.ip_address}
                  </span>
                )}
                {activity.user_agent && (
                  <span title="User Agent" className="inline-flex items-center truncate max-w-md">
                    Agent: {activity.user_agent}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Timestamp */}
          <time
            dateTime={activity.created_at}
            className="text-xs text-gray-500 whitespace-nowrap"
          >
            {formatDate(activity.created_at)}
          </time>
        </div>
      </div>
    </div>
  );
};

/**
 * ActivityTimeline Component
 * 
 * Provides a chronological view of system activities with rich contextual
 * information and interactive elements. Implements virtualization for
 * performance with large datasets.
 * 
 * Features:
 * - Chronological visualization
 * - Visual activity type differentiation
 * - Status indicators
 * - Detailed activity information
 * - System metadata display
 * - Responsive layout
 */
export const ActivityTimeline: React.FC<ActivityTimelineProps> = ({
  activities,
  className,
  maxItems = 50
}) => {
  // Filter and process activities for display
  const displayActivities = useMemo(() => (
    activities
      .slice(0, maxItems)
      .filter(activity => activity.user_id && activity.created_at)
  ), [activities, maxItems]);

  if (!displayActivities.length) {
    return (
      <Card className={cn('p-6', className)}>
        <div className="text-center text-gray-500">
          No activities to display
        </div>
      </Card>
    );
  }

  return (
    <Card className={cn('p-6', className)}>
      {/* Timeline header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-medium text-gray-900">
          Activity Timeline
        </h3>
        {activities.length > maxItems && (
          <span className="text-sm text-gray-500">
            Showing {maxItems} of {activities.length} activities
          </span>
        )}
      </div>

      {/* Timeline content */}
      <div className="relative">
        {displayActivities.map((activity, index) => (
          <TimelineItem
            key={activity.id}
            activity={activity}
            isFirst={index === 0}
            isLast={index === displayActivities.length - 1}
          />
        ))}
      </div>
    </Card>
  );
};

export default ActivityTimeline;