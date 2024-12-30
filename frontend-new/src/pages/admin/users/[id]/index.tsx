// src/pages/admin/users/[id]/index.tsx

import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { 
  ArrowLeft,
  Mail,
  User,
  Phone,
  DollarSign,
  Clock,
  Ticket,
  Trophy,
  Target,
  Activity
} from 'lucide-react';
import type { NextPageWithLayout } from '@/types/next';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { useUserStore } from '@/stores/userStore';
import { LoadingSpinner } from '@/components/ui/loading';
import { Card } from '@/components/ui/card';
import { formatDate } from '@/utils/date';
import { formatCurrency } from '@/utils/currency';
import { UserAvatar } from '@/components/users/shared/UserAvatar';
import { UserStatusBadge } from '@/components/users/shared/UserStatusBadge';
import { UserRoleBadge } from '@/components/users/shared/UserRoleBadge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { UserActivity } from '@/components/users/detail/UserActivity';
import { UserCredits } from '@/components/users/detail/UserCredits';
import { UserLoyalty } from '@/components/users/detail/UserLoyalty';

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  subValue?: string;
  iconColor?: string;
  bgColor?: string;
}

const StatCard: React.FC<StatCardProps> = ({
  icon,
  label,
  value,
  subValue,
  iconColor = 'text-indigo-600',
  bgColor = 'bg-indigo-50'
}) => (
  <Card className="p-4">
    <div className="flex items-start space-x-3">
      <div className={`rounded-lg p-2 ${bgColor}`}>
        <div className={iconColor}>{icon}</div>
      </div>
      <div>
        <p className="text-sm font-medium text-gray-600">{label}</p>
        <p className="mt-1 text-2xl font-semibold text-gray-900">{value}</p>
        {subValue && (
          <p className="mt-0.5 text-sm text-gray-500">{subValue}</p>
        )}
      </div>
    </div>
  </Card>
);

const UserDetailPage: NextPageWithLayout = () => {
  const router = useRouter();
  const { id } = router.query;
  const userId = id ? parseInt(id as string, 10) : null;
  const { activeUser, isLoading, error, fetchUser, clearActiveUser } = useUserStore();

  useEffect(() => {
    if (userId && !isNaN(userId)) {
      fetchUser(userId);
    }
    return () => clearActiveUser();
  }, [userId, fetchUser, clearActiveUser]);

  if (isLoading || !activeUser) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto mt-8 p-6 bg-white rounded-lg shadow">
        <div className="text-center">
          <h3 className="text-lg font-medium text-gray-900">{error}</h3>
          <button
            onClick={() => router.push('/admin/users')}
            className="mt-4 text-indigo-600 hover:text-indigo-500"
          >
            Return to Users
          </button>
        </div>
      </div>
    );
  }

  // Calculate performance metrics
  const winRate = ((activeUser.gaming_metrics.total_wins / activeUser.gaming_metrics.total_tickets) * 100).toFixed(1);
  const revealRate = ((activeUser.gaming_metrics.revealed_tickets / activeUser.gaming_metrics.total_tickets) * 100).toFixed(1);

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-4">
            <button
              onClick={() => router.push('/admin/users')}
              className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700"
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              Back to Users
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        <div className="grid grid-cols-12 gap-6">
          {/* Left Column - Profile */}
          <div className="col-span-12 lg:col-span-4 space-y-6">
            {/* User Profile Card */}
            <Card className="overflow-hidden">
              <div className="h-32 bg-gradient-to-r from-indigo-500 to-purple-500">
                <div className="px-6 pt-4">
                  <h2 className="text-xl font-bold text-white">User Profile</h2>
                </div>
              </div>
              <div className="px-6 py-4 -mt-12">
                <UserAvatar
                  firstName={activeUser.first_name}
                  lastName={activeUser.last_name}
                  email={activeUser.email}
                  size="lg"
                  className="ring-4 ring-white mb-4"
                />
                <div className="space-y-4">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">
                      {[activeUser.first_name, activeUser.last_name].filter(Boolean).join(' ') || activeUser.username}
                    </h3>
                    <div className="mt-2 space-y-2">
                      <div className="flex items-center text-gray-500">
                        <Mail className="w-4 h-4 mr-2" />
                        {activeUser.email}
                      </div>
                      <div className="flex items-center text-gray-500">
                        <User className="w-4 h-4 mr-2" />
                        {activeUser.username}
                      </div>
                      <div className="flex items-center text-gray-500">
                        <Phone className="w-4 h-4 mr-2" />
                        {activeUser.phone_number || 'No phone number'}
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <UserStatusBadge
                      isActive={activeUser.is_active}
                      isVerified={activeUser.is_verified}
                      isAdmin={activeUser.is_admin}
                    />
                    <UserRoleBadge role={activeUser.is_admin ? 'admin' : 'user'} />
                  </div>
                </div>
              </div>
            </Card>

            {/* Balance Card */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center">
                  <DollarSign className="h-5 w-5 text-green-500 mr-2" />
                  <h3 className="text-lg font-medium text-gray-900">Balance</h3>
                </div>
                <span className="text-2xl font-bold text-gray-900">
                  {formatCurrency(activeUser.balance_available)}
                </span>
              </div>
              <p className="text-sm text-gray-500 flex items-center">
                <Clock className="h-4 w-4 mr-1" />
                Last Updated: {activeUser.balance_last_updated ? formatDate(activeUser.balance_last_updated) : 'Never'}
              </p>
            </Card>

            {/* Recent Activity Card */}
            <Card className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Activity</h3>
              <div className="space-y-4">
                {activeUser.recent_activities.map((activity, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div>
                      <p className="text-sm font-medium text-gray-900">{activity.type}</p>
                      <p className="text-xs text-gray-500">{formatDate(activity.timestamp)}</p>
                    </div>
                    <span className={`
                      px-2.5 py-0.5 rounded-full text-xs font-medium
                      ${activity.status === 'success' ? 'bg-green-100 text-green-800' :
                        activity.status === 'failed' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'}
                    `}>
                      {activity.status}
                    </span>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* Right Column - Gaming Stats & Content */}
          <div className="col-span-12 lg:col-span-8 space-y-6">
            {/* Gaming Performance Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                icon={<Ticket className="h-5 w-5" />}
                label="Total Tickets"
                value={activeUser.gaming_metrics.total_tickets}
                subValue={`${activeUser.gaming_metrics.revealed_tickets} revealed`}
                iconColor="text-blue-600"
                bgColor="bg-blue-50"
              />
              <StatCard
                icon={<Trophy className="h-5 w-5" />}
                label="Win Rate"
                value={`${winRate}%`}
                subValue={`${activeUser.gaming_metrics.total_wins} wins`}
                iconColor="text-amber-600"
                bgColor="bg-amber-50"
              />
              <StatCard
                icon={<Target className="h-5 w-5" />}
                label="Raffles Joined"
                value={activeUser.gaming_metrics.total_raffles}
                iconColor="text-green-600"
                bgColor="bg-green-50"
              />
              <StatCard
                icon={<Activity className="h-5 w-5" />}
                label="Reveal Rate"
                value={`${revealRate}%`}
                subValue={`${activeUser.gaming_metrics.revealed_tickets} of ${activeUser.gaming_metrics.total_tickets}`}
                iconColor="text-purple-600"
                bgColor="bg-purple-50"
              />
            </div>

            {/* Tabbed Content */}
            <Card className="p-6">
              <Tabs defaultValue="loyalty" className="space-y-6">
                <TabsList>
                  <TabsTrigger value="loyalty">Loyalty</TabsTrigger>
                  <TabsTrigger value="credits">Credits</TabsTrigger>
                  <TabsTrigger value="activity">Activity</TabsTrigger>
                </TabsList>

                <TabsContent value="loyalty">
                  <UserLoyalty userId={activeUser.id} />
                </TabsContent>

                <TabsContent value="credits">
                  <UserCredits userId={activeUser.id} />
                </TabsContent>

                <TabsContent value="activity">
                  <UserActivity userId={activeUser.id} />
                </TabsContent>
              </Tabs>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

UserDetailPage.getLayout = (page) => (
  <AdminLayout>{page}</AdminLayout>
);

UserDetailPage.requireAuth = true;

export default UserDetailPage;