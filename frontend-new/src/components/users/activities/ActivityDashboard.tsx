import React, { useEffect, useMemo } from 'react';
import { 
  BarChart3,
  Users,
  AlertTriangle,
  Filter,
  Clock,
  ChevronDown,
  Calendar
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { useActivityStore } from '@/stores/userActivityStore';
import { ActivityFilters } from './ActivityFilters';
import { ActivityTimeline } from './ActivityTimeline';
import { ActivityStats } from './ActivityStats';
import type { ActivityType, ActivityStatus } from '@/types/users';
import { ACTIVITY_TYPE_META, ACTIVITY_STATUS_META } from '@/types/users/activities';
import { formatDate } from '@/utils/date';
import { cn } from '@/lib/utils';

interface TimeframeOption {
  label: string;
  value: string;
  description?: string;
}

const TIMEFRAME_OPTIONS: TimeframeOption[] = [
  { 
    label: 'Last 24 Hours',
    value: '24h',
    description: 'Activity from the past 24 hours'
  },
  { 
    label: 'Last 7 Days',
    value: '7d',
    description: 'Weekly activity overview'
  },
  { 
    label: 'Last 30 Days',
    value: '30d',
    description: 'Monthly activity patterns'
  },
  { 
    label: 'Last 90 Days',
    value: '90d',
    description: 'Quarterly activity analysis'
  }
];

/**
 * Activity Dashboard Component
 * 
 * Provides comprehensive monitoring and analysis of system-wide user activities.
 * Integrates with activity store for real-time updates and historical data.
 */
export const ActivityDashboard: React.FC = () => {
  const {
    activities,
    metrics,
    typeStats,
    isLoading,
    error,
    fetchMetrics,
    fetchTypeStats,
    fetchActivities
  } = useActivityStore();

  const [selectedTimeframe, setSelectedTimeframe] = React.useState<string>('24h');
  const [showFilters, setShowFilters] = React.useState(false);

  // Initial data fetch
  useEffect(() => {
    fetchMetrics(selectedTimeframe);
    fetchTypeStats();
    fetchActivities();
  }, [selectedTimeframe, fetchMetrics, fetchTypeStats, fetchActivities]);

  // Calculate activity distribution percentages
  const activityDistribution = useMemo(() => {
    const defaultDistribution: Record<ActivityType, number> = {
      login: 0,
      logout: 0,
      profile_update: 0,
      password_change: 0,
      status_change: 0,
      email_verification: 0,
      admin_login: 0,
      account_deletion: 0
    };
  
    if (!typeStats) return defaultDistribution;

    const total = Object.values(typeStats).reduce((sum, count) => sum + count, 0);
    return Object.entries(typeStats).reduce((acc, [type, count]) => ({
      ...acc,
      [type]: (count / total) * 100
    }), {} as Record<ActivityType, number>);
  }, [typeStats]);

  // Calculate status metrics
  const statusMetrics = useMemo(() => {
    if (!metrics?.activities_by_status) return null;

    const total = Object.values(metrics.activities_by_status).reduce((sum, count) => sum + count, 0);
    
    return {
      total,
      percentages: Object.entries(metrics.activities_by_status).reduce((acc, [status, count]) => ({
        ...acc,
        [status]: (count / total) * 100
      }), {} as Record<ActivityStatus, number>)
    };
  }, [metrics]);

  return (
    <div className="space-y-6">
      {/* Header with Controls */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Activity Dashboard</h1>
          <p className="mt-1 text-sm text-gray-500">
            Monitor and analyze user activities across the platform
          </p>
        </div>

        <div className="flex items-center space-x-4">
          {/* Timeframe Selector */}
          <div className="relative">
            <select
              value={selectedTimeframe}
              onChange={(e) => setSelectedTimeframe(e.target.value)}
              className="appearance-none bg-white pl-3 pr-10 py-2 border border-gray-300 rounded-lg
                       focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              {TIMEFRAME_OPTIONS.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          </div>

          {/* Filter Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={cn(
              'inline-flex items-center px-4 py-2 rounded-lg transition-colors',
              showFilters
                ? 'bg-indigo-100 text-indigo-700'
                : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
            )}
          >
            <Filter className="h-4 w-4 mr-2" />
            Filters
          </button>
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <Card className="p-6">
          <ActivityFilters onClose={() => setShowFilters(false)} />
        </Card>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="p-6">
          <div className="flex items-center">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-600">Total Activities</p>
              <p className="mt-2 text-3xl font-semibold text-gray-900">
                {metrics?.total_activities.toLocaleString()}
              </p>
            </div>
            <div className="p-3 bg-indigo-50 rounded-lg">
              <BarChart3 className="h-6 w-6 text-indigo-600" />
            </div>
          </div>
          <div className="mt-4 text-sm text-gray-500">
            Over the selected timeframe
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-600">Active Users</p>
              <p className="mt-2 text-3xl font-semibold text-gray-900">
                {metrics?.activities_by_type.login.toLocaleString()}
              </p>
            </div>
            <div className="p-3 bg-green-50 rounded-lg">
              <Users className="h-6 w-6 text-green-600" />
            </div>
          </div>
          <div className="mt-4 text-sm text-gray-500">
            Unique users with activity
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-600">Failed Activities</p>
              <p className="mt-2 text-3xl font-semibold text-gray-900">
                {metrics?.activities_by_status.failed.toLocaleString()}
              </p>
            </div>
            <div className="p-3 bg-red-50 rounded-lg">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
          </div>
          <div className="mt-4 text-sm text-gray-500">
            Activities that failed or were blocked
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-600">Last Activity</p>
              <p className="mt-2 text-xl font-semibold text-gray-900">
                {activities[0] ? formatDate(activities[0].created_at) : 'N/A'}
              </p>
            </div>
            <div className="p-3 bg-blue-50 rounded-lg">
              <Clock className="h-6 w-6 text-blue-600" />
            </div>
          </div>
          <div className="mt-4 text-sm text-gray-500">
            Most recent system activity
          </div>
        </Card>
      </div>

      {/* Activity Distribution and Timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Activity Stats */}
        <div className="lg:col-span-1">
          <ActivityStats
            typeStats={typeStats}
            statusMetrics={statusMetrics}
            distribution={activityDistribution}
          />
        </div>

        {/* Activity Timeline */}
        <div className="lg:col-span-2">
          <ActivityTimeline activities={activities.slice(0, 10)} />
        </div>
      </div>
    </div>
  );
};

export default ActivityDashboard;