// src/components/raffles/admin/tabs/RaffleOverviewTab.tsx

import { useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { RaffleStatsPanel } from '@/components/raffles/shared/RaffleStatsPanel';
import { useRaffleStore } from '@/stores/raffleStore';
import type { Raffle } from '@/types/raffles';
import { formatCurrency } from '@/utils/currency';
import { formatDate } from '@/utils/date';

interface RaffleOverviewTabProps {
  raffle: Raffle;
}

export const RaffleOverviewTab: React.FC<RaffleOverviewTabProps> = ({ raffle }) => {
  const { raffleStats, loadStats } = useRaffleStore();

  // Load stats when the component mounts
  useEffect(() => {
    loadStats(raffle.id);
  }, [raffle.id, loadStats]);

  return (
    <div className="space-y-6">
      {/* Quick Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="p-4">
          <h3 className="text-sm font-medium text-gray-500">Total Tickets</h3>
          <p className="mt-2 text-3xl font-semibold text-gray-900">
            {raffle.total_tickets.toLocaleString()}
          </p>
        </Card>

        <Card className="p-4">
          <h3 className="text-sm font-medium text-gray-500">Ticket Price</h3>
          <p className="mt-2 text-3xl font-semibold text-gray-900">
            {formatCurrency(raffle.ticket_price)}
          </p>
        </Card>

        <Card className="p-4">
          <h3 className="text-sm font-medium text-gray-500">Max Per User</h3>
          <p className="mt-2 text-3xl font-semibold text-gray-900">
            {raffle.max_tickets_per_user.toLocaleString()}
          </p>
        </Card>

        <Card className="p-4">
          <h3 className="text-sm font-medium text-gray-500">Total Value</h3>
          <p className="mt-2 text-3xl font-semibold text-gray-900">
            {formatCurrency(raffle.total_tickets * raffle.ticket_price)}
          </p>
        </Card>
      </div>

      {/* Timeline */}
      <Card className="p-6">
        <h3 className="text-lg font-medium mb-4">Schedule</h3>
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-500">Start Time</p>
              <p className="mt-1 font-medium">{formatDate(raffle.start_time)}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">End Time</p>
              <p className="mt-1 font-medium">{formatDate(raffle.end_time)}</p>
            </div>
          </div>
          
          <div className="relative pt-2">
            <div className="overflow-hidden h-2 text-xs flex rounded bg-gray-200">
              <div 
                className="bg-indigo-500"
                style={{
                  width: `${Math.min(100, Math.max(0, (Date.now() - new Date(raffle.start_time).getTime()) / 
                    (new Date(raffle.end_time).getTime() - new Date(raffle.start_time).getTime()) * 100))}%`
                }}
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Stats Panel */}
      {raffleStats && <RaffleStatsPanel stats={raffleStats} />}

      {/* Prize Pool Summary */}
      {raffle.prize_pool_summary && (
        <Card className="p-6">
          <h3 className="text-lg font-medium mb-4">Prize Pool</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <h4 className="text-sm font-medium text-gray-500">Available Prizes</h4>
              <div className="mt-2 space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm">Instant Win</span>
                  <span className="font-medium">
                    {raffle.prize_pool_summary.available_instances.instant_win}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Draw Win</span>
                  <span className="font-medium">
                    {raffle.prize_pool_summary.available_instances.draw_win}
                  </span>
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-medium text-gray-500">Total Value</h4>
              <div className="mt-2 space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm">Retail</span>
                  <span className="font-medium">
                    {formatCurrency(raffle.prize_pool_summary.total_value.retail)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Cash</span>
                  <span className="font-medium">
                    {formatCurrency(raffle.prize_pool_summary.total_value.cash)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Credit</span>
                  <span className="font-medium">
                    {formatCurrency(raffle.prize_pool_summary.total_value.credit)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};