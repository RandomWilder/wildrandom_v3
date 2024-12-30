// src/components/users/detail/UserStats.tsx

import React from 'react';
import { 
  Ticket, 
  Trophy,
  Activity,
  Target,
  Crown 
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import type { UserDetail } from '@/types/users/models';
import { cn } from '@/utils/cn';

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  subValue?: string;
  className?: string;
}

const StatCard: React.FC<StatCardProps> = ({
  icon,
  label,
  value,
  subValue,
  className
}) => (
  <div className={cn(
    "bg-white rounded-lg border border-gray-200 p-4",
    className
  )}>
    <div className="flex items-center">
      <div className="flex-shrink-0 p-2 bg-gray-50 rounded-lg">
        {icon}
      </div>
      <div className="ml-4">
        <p className="text-sm font-medium text-gray-600">{label}</p>
        <p className="text-2xl font-semibold text-gray-900">
          {value}
        </p>
        {subValue && (
          <p className="text-sm text-gray-500">{subValue}</p>
        )}
      </div>
    </div>
  </div>
);

export const UserStats: React.FC<{ user: UserDetail }> = ({ user }) => {
  // Calculate derived metrics
  const winRate = user.gaming_metrics.total_tickets > 0
    ? ((user.gaming_metrics.total_wins / user.gaming_metrics.total_tickets) * 100).toFixed(1)
    : '0';

  const revealRate = user.gaming_metrics.total_tickets > 0
    ? ((user.gaming_metrics.revealed_tickets / user.gaming_metrics.total_tickets) * 100).toFixed(1)
    : '0';

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard
        icon={<Ticket className="h-5 w-5 text-blue-600" />}
        label="Total Tickets"
        value={user.gaming_metrics.total_tickets.toLocaleString()}
        subValue={`${user.gaming_metrics.revealed_tickets} revealed`}
      />
      
      <StatCard
        icon={<Trophy className="h-5 w-5 text-amber-600" />}
        label="Win Rate"
        value={`${winRate}%`}
        subValue={`${user.gaming_metrics.total_wins} wins`}
      />
      
      <StatCard
        icon={<Target className="h-5 w-5 text-green-600" />}
        label="Raffles Joined"
        value={user.gaming_metrics.total_raffles}
      />
      
      <StatCard
        icon={<Activity className="h-5 w-5 text-purple-600" />}
        label="Reveal Rate"
        value={`${revealRate}%`}
        subValue={`${user.gaming_metrics.revealed_tickets} of ${user.gaming_metrics.total_tickets}`}
      />
    </div>
  );
};