import { useEffect } from 'react';
import { useRouter } from 'next/router';
import type { NextPageWithLayout } from '@/types/next';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { UserList } from '@/components/users/UserList';
import { useUserStore } from '@/stores/userStore';
import { LoadingSpinner } from '@/components/ui/loading';
import { Card } from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';

/**
 * User Administration Page
 * 
 * Primary interface for user management operations. Implements core
 * administrative functionality with enterprise-grade security and
 * audit capabilities.
 * 
 * Key Features:
 * - Comprehensive user management
 * - Role-based access control
 * - Activity monitoring
 * - Batch operations support
 * - Audit trail integration
 */
const UsersPage: NextPageWithLayout = () => {
  const router = useRouter();
  const { isLoading, error, users, fetchUsers } = useUserStore();

  // Initial data fetch
  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Loading state
  if (isLoading && !users.length) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <Card className="mx-auto max-w-2xl mt-8 p-6">
        <div className="flex items-start space-x-3 text-red-600">
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          <div>
            <h3 className="font-medium">Error Loading Users</h3>
            <p className="mt-1 text-sm">{error}</p>
            <button
              onClick={() => fetchUsers()}
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
    <div className="space-y-8">
      {/* Page content wrapper with consistent max-width and padding */}
      <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* UserList component for user management operations */}
        <UserList />
      </div>
    </div>
  );
};

// Apply admin layout wrapper
UsersPage.getLayout = (page) => (
  <AdminLayout>{page}</AdminLayout>
);

// Require authentication
UsersPage.requireAuth = true;

export default UsersPage;