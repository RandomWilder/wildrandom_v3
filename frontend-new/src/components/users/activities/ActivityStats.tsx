import React, { useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { ActivityIcon } from '../shared/ActivityIcon';
import type { ActivityType, ActivityStatus } from '@/types/users';
import { ACTIVITY_TYPE_META, ACTIVITY_STATUS_META } from '@/types/users/activities';
import { cn } from '@/lib/utils';

interface ActivityStatsProps {
  typeStats: Record<ActivityType, number> | null;
  statusMetrics: {
    total: number;
    percentages: Record<ActivityStatus, number>;
  } | null;
  distribution: Record<ActivityType, number>;
  className?: string;
}

interface StatBarProps {
  label: string;
  value: number;
  percentage: number;
  color: string;
  bgColor: string;
  icon?: React.ReactNode;
}

/**
 * StatBar Component
 * Renders a single statistics bar with consistent styling and layout
 */
const StatBar: React.FC<StatBarProps> = ({
  label,
  value,
  percentage,
  color,
  bgColor,
  icon
}) => (
  <div className="space-y-2">
    <div className="flex items-center justify-between text-sm">
      <div className="flex items-center space-x-2">
        {icon}
        <span className="font-medium text-gray-700">{label}</span>
      </div>
      <span className="text-gray-500">{value.toLocaleString()}</span>
    </div>
    <div className="relative">
      <Progress
        value={percentage}
        className={cn('h-2', bgColor)}
      />
      <span className="absolute right-0 top-0 -mt-6 text-xs text-gray-500">
        {percentage.toFixed(1)}%
      </span>
    </div>
  </div>
);

/**
 * ActivityStats Component
 * Provides comprehensive statistical analysis of system activities
 */
export const ActivityStats: React.FC<ActivityStatsProps> = ({
  typeStats,
  statusMetrics,
  distribution,
  className
}) => {
  if (!typeStats || !statusMetrics) {
    return (
      <Card className={cn('p-6', className)}>
        <div className="text-center text-gray-500">
          No statistics available
        </div>
      </Card>
    );
  }

  return (
    <Card className={cn('p-6 space-y-8', className)}>
      {/* Activity Type Distribution */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Activity Distribution
        </h3>
        <div className="space-y-4">
          {Object.entries(ACTIVITY_TYPE_META).map(([type, meta]) => {
            const activityType = type as ActivityType;
            return (
              <StatBar
                key={type}
                label={meta.label}
                value={typeStats[activityType] || 0}
                percentage={distribution[activityType] || 0}
                color="text-indigo-600"
                bgColor="bg-indigo-50"
                icon={
                  <ActivityIcon
                    type={activityType}
                    size="sm"
                    showBackground={false}
                  />
                }
              />
            );
          })}
        </div>
      </div>

      {/* Status Breakdown */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Status Breakdown
        </h3>
        <div className="space-y-4">
          {Object.entries(ACTIVITY_STATUS_META).map(([status, meta]) => {
            const activityStatus = status as ActivityStatus;
            return (
              <StatBar
                key={status}
                label={meta.label}
                value={Math.round(statusMetrics.total * (statusMetrics.percentages[activityStatus] / 100))}
                percentage={statusMetrics.percentages[activityStatus] || 0}
                color="text-indigo-600"
                bgColor="bg-indigo-50"
              />
            );
          })}
        </div>

        {/* Total Activities Summary */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="flex justify-between items-baseline">
            <span className="text-sm font-medium text-gray-700">
              Total Activities
            </span>
            <span className="text-2xl font-semibold text-gray-900">
              {statusMetrics.total.toLocaleString()}
            </span>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default ActivityStats;