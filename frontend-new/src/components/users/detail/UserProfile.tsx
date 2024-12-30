import React from 'react';
import { 
  ArrowLeft,
  User,
  Mail,
  Phone,
  Shield,
  Calendar,
  Clock,
  Trophy,
  Ticket,
  Target,
  Crown,
  Activity,
  CreditCard,
  Star
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { UserAvatar } from '../shared/UserAvatar';
import { UserStatusBadge } from '../shared/UserStatusBadge';
import { UserRoleBadge } from '../shared/UserRoleBadge';
import { formatDate } from '@/utils/date';
import { formatCurrency } from '@/utils/currency';
import { cn } from '@/utils/cn';
import type { UserDetail } from '@/types/users/models';

interface MetricCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  subValue?: string;
  iconColor?: string;
}

const MetricCard: React.FC<MetricCardProps> = ({ 
  icon, 
  label, 
  value, 
  subValue,
  iconColor = 'text-indigo-500'
}) => (
  <div className="bg-white rounded-lg border border-gray-200 p-4">
    <div className="flex items-start">
      <div className={cn("rounded-lg p-2 bg-opacity-10", iconColor)}>
        {icon}
      </div>
      <div className="ml-3">
        <p className="text-sm font-medium text-gray-600">{label}</p>
        <p className="mt-1 text-2xl font-semibold text-gray-900">{value}</p>
        {subValue && (
          <p className="mt-1 text-sm text-gray-500">{subValue}</p>
        )}
      </div>
    </div>
  </div>
);

export const UserProfile: React.FC<{ user: UserDetail }> = ({ user }) => {
  // Calculate win rate
  const winRate = user.gaming_metrics.total_tickets > 0
    ? (user.gaming_metrics.total_wins / user.gaming_metrics.total_tickets * 100).toFixed(1)
    : '0';

  return (
    <div className="space-y-6">
      {/* Header Profile Card */}
      <Card className="overflow-hidden">
        <div className="h-32 bg-gradient-to-r from-indigo-500 to-purple-500">
          <div className="px-6 pt-4">
            <h2 className="text-xl font-bold text-white">User Profile</h2>
          </div>
        </div>
        <div className="px-6 py-4 -mt-12">
          <UserAvatar
            firstName={user.first_name}
            lastName={user.last_name}
            email={user.email}
            size="lg"
            className="ring-4 ring-white mb-4"
          />
          <div className="space-y-4">
            <div>
              <h3 className="text-xl font-bold text-gray-900">
                {[user.first_name, user.last_name].filter(Boolean).join(' ') || user.username}
              </h3>
              <div className="mt-1 space-y-1">
                <div className="flex items-center text-gray-500">
                  <Mail className="w-4 h-4 mr-2" />
                  {user.email}
                </div>
                <div className="flex items-center text-gray-500">
                  <User className="w-4 h-4 mr-2" />
                  {user.username}
                </div>
                <div className="flex items-center text-gray-500">
                  <Phone className="w-4 h-4 mr-2" />
                  {user.phone_number || 'No phone number'}
                </div>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <UserStatusBadge
                isActive={user.is_active}
                isVerified={user.is_verified}
                isAdmin={user.is_admin}
              />
              <UserRoleBadge role={user.is_admin ? 'admin' : 'user'} />
            </div>
          </div>
        </div>
      </Card>

      {/* Gaming Performance Metrics */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Gaming Performance</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            icon={<Ticket className="h-5 w-5 text-blue-500" />}
            label="Total Tickets"
            value={user.gaming_metrics.total_tickets.toLocaleString()}
            iconColor="text-blue-500"
          />
          <MetricCard
            icon={<Target className="h-5 w-5 text-green-500" />}
            label="Win Rate"
            value={`${winRate}%`}
            subValue={`${user.gaming_metrics.total_wins} wins`}
            iconColor="text-green-500"
          />
          <MetricCard
            icon={<Trophy className="h-5 w-5 text-amber-500" />}
            label="Total Raffles"
            value={user.gaming_metrics.total_raffles}
            iconColor="text-amber-500"
          />
          <MetricCard
            icon={<Activity className="h-5 w-5 text-purple-500" />}
            label="Revealed Tickets"
            value={user.gaming_metrics.revealed_tickets}
            subValue={`${((user.gaming_metrics.revealed_tickets / user.gaming_metrics.total_tickets) * 100).toFixed(1)}%`}
            iconColor="text-purple-500"
          />
        </div>
      </div>

      {/* Loyalty Status */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <Crown className="h-6 w-6 text-amber-500 mr-2" />
            <h3 className="text-lg font-medium text-gray-900">Loyalty Status</h3>
          </div>
          <span className="px-3 py-1 rounded-full text-sm font-medium bg-indigo-100 text-indigo-700">
            {user.loyalty_level}
          </span>
        </div>

        <div className="space-y-6">
          {/* Progress Bar */}
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-gray-500">Level Progress</span>
              <span className="font-medium">
                {user.loyalty_total_entries} entries
              </span>
            </div>
            <Progress value={
              Math.min((user.loyalty_total_entries / 100) * 100, 100)
            } />
          </div>

          {/* Loyalty Metrics */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-500">Total Spend</p>
              <p className="text-lg font-medium mt-1">
                {formatCurrency(user.loyalty_total_spend)}
              </p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-500">Streak Days</p>
              <p className="text-lg font-medium mt-1">
                {user.loyalty_streak_days}
              </p>
            </div>
          </div>

          {/* Badges */}
          {user.loyalty_badges.length > 0 && (
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">Earned Badges</p>
              <div className="flex flex-wrap gap-2">
                {user.loyalty_badges.map((badge, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800"
                  >
                    <Star className="w-3 h-3 mr-1" />
                    {badge}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Balance Information */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <CreditCard className="h-6 w-6 text-green-500 mr-2" />
            <h3 className="text-lg font-medium text-gray-900">Balance</h3>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {formatCurrency(user.balance_available)}
          </p>
        </div>
        <p className="text-sm text-gray-500">
          Last Updated: {user.balance_last_updated ? formatDate(user.balance_last_updated) : 'Never'}
        </p>
      </Card>

      {/* Recent Activity */}
      <Card className="p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Activity</h3>
        <div className="space-y-4">
          {user.recent_activities.map((activity, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
            >
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {activity.type}
                </p>
                <p className="text-xs text-gray-500">
                  {formatDate(activity.timestamp)}
                </p>
              </div>
              <span className={cn(
                "px-2.5 py-0.5 rounded-full text-xs font-medium",
                activity.status === 'success' ? 'bg-green-100 text-green-800' :
                activity.status === 'failed' ? 'bg-red-100 text-red-800' :
                'bg-gray-100 text-gray-800'
              )}>
                {activity.status}
              </span>
            </div>
          ))}
        </div>
      </Card>

      {/* Account History */}
      {user.status_changes.length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Account History</h3>
          <div className="space-y-4">
          {user.status_changes.map((change, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
            >
              <div>
                <p className="text-sm text-gray-900">
                  Status changed from{' '}
                  <span className={change.previous_status ? 'text-green-600' : 'text-red-600'}>
                    {change.previous_status ? 'Active' : 'Inactive'}
                  </span>
                  {' '}to{' '}
                  <span className={change.new_status ? 'text-green-600' : 'text-red-600'}>
                    {change.new_status ? 'Active' : 'Inactive'}
                  </span>
                </p>
                {change.reason && (
                  <p className="text-sm text-gray-500 mt-1">
                    Reason: {change.reason}
                  </p>
                )}
                <p className="text-xs text-gray-500 mt-1">
                  {formatDate(change.timestamp)}
                </p>
              </div>
            </div>
          ))}
          </div>
        </Card>
      )}
    </div>
  );
};