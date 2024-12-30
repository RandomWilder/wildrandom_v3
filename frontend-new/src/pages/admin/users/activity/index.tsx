import { useEffect } from 'react';
import type { NextPageWithLayout } from '@/types/next';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { ActivityDashboard } from '@/components/users/activities/ActivityDashboard';
import { LoadingSpinner } from '@/components/ui/loading';
import { Card } from '@/components/ui/card';
import { useActivityStore } from '@/stores/userActivityStore';
import { AlertCircle } from 'lucide-react';

/**
 * User Activity Dashboard Page
 * 
 * Provides system-wide visibility into user activities with real-time 
 * monitoring capabilities and comprehensive analytics. Implements 
 * efficient data management patterns for high-volume activity streams.
 * 
 * Features:
 * - Real-time activity monitoring
 * - Advanced filtering capabilities
 * - Performance optimizations for large datasets
 * - Analytics and trend visualization
 */
const ActivityDashboardPage: NextPageWithLayout = () => {
  const {
    error,
    isLoading,
    fetchMetrics,
    fetchTypeStats,
    fetchActivities
  } = useActivityStore();

  // Initial data fetch with strategic loading pattern
  useEffect(() => {
    // Prioritize metrics and type stats for immediate insights
    Promise.all([
      fetchMetrics(),
      fetchTypeStats()
    ]).then(() => {
      // Load detailed activity data after critical metrics
      fetchActivities();
    });
  }, [fetchMetrics, fetchTypeStats, fetchActivities]);

  // Loading state with visual feedback
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  // Error state with recovery options
  if (error) {
    return (
      <Card className="mx-auto max-w-2xl mt-8 p-6">
        <div className="flex items-start space-x-3 text-red-600">
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          <div>
            <h3 className="font-medium">Error Loading Activity Data</h3>
            <p className="mt-1 text-sm">{error}</p>
            <button
              onClick={() => {
                fetchMetrics();
                fetchTypeStats();
                fetchActivities();
              }}
              className="mt-4 text-sm font-medium hover:text-red-700"
            >
              Try Again
            </button>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Activity Dashboard with configurable display options */}
      <ActivityDashboard />
    </div>
  );
};

// Apply admin layout wrapper with navigation context
ActivityDashboardPage.getLayout = (page) => (
  <AdminLayout>{page}</AdminLayout>
);

// Enforce authentication and access control
ActivityDashboardPage.requireAuth = true;

export default ActivityDashboardPage;