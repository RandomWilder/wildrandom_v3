import React, { useMemo } from 'react';
import type { PublicStatsResponse } from '@/types/raffles';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

interface RaffleStatsPanelProps {
  stats: PublicStatsResponse;  // Updated to use PublicStatsResponse
}

interface CalculatedStats {
  soldPercentage: number;
  revealedPercentage: number;
  instantWinPercentage: number;
  formattedStats: {
    soldTickets: string;
    availableTickets: string;
    revealedTickets: string;
    eligibleTickets: string;
    instantWinsDiscovered: string;
  };
}

/**
 * Calculate derived statistics from the provided raffle stats
 * @param stats The raw raffle statistics
 * @returns Calculated percentages and formatted string values
 */
const calculateStats = (stats: PublicStatsResponse): CalculatedStats => {
  // Calculate percentages with safety checks for division by zero
  const soldPercentage = (stats.sold_tickets / stats.total_tickets) * 100;
  const revealedPercentage = stats.sold_tickets > 0 
    ? (stats.revealed_tickets / stats.sold_tickets) * 100 
    : 0;
  const instantWinPercentage = stats.eligible_tickets > 0 
    ? (stats.instant_wins_discovered / stats.eligible_tickets) * 100 
    : 0;

  return {
    soldPercentage,
    revealedPercentage,
    instantWinPercentage,
    formattedStats: {
      soldTickets: `${stats.sold_tickets.toLocaleString()} / ${stats.total_tickets.toLocaleString()}`,
      availableTickets: stats.available_tickets.toLocaleString(),
      revealedTickets: stats.revealed_tickets.toLocaleString(),
      eligibleTickets: stats.eligible_tickets.toLocaleString(),
      instantWinsDiscovered: stats.instant_wins_discovered.toLocaleString(),
    }
  };
};

/**
 * RaffleStatsPanel Component
 * Displays comprehensive statistics for a raffle including sales progress,
 * ticket metrics, and instant win statistics.
 */
export const RaffleStatsPanel: React.FC<RaffleStatsPanelProps> = ({ stats }) => {
  // Memoize calculations to prevent unnecessary recalculations
  const {
    soldPercentage,
    revealedPercentage,
    instantWinPercentage,
    formattedStats
  } = useMemo(() => calculateStats(stats), [stats]);

  return (
    <div className="space-y-6">
      {/* Sales Progress Section */}
      <section aria-label="Sales Progress" className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="font-medium text-gray-700">Ticket Sales Progress</span>
          <span className="text-gray-600">
            {formattedStats.soldTickets} ({Math.round(soldPercentage)}%)
          </span>
        </div>
        <Progress 
          value={soldPercentage} 
          className="h-2"
          aria-label="Sales progress"
        />
      </section>

      {/* Key Metrics Grid */}
      <section aria-label="Key Metrics" className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-500">Available Tickets</p>
              <p className="text-2xl font-bold">{formattedStats.availableTickets}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-500">Revealed Tickets</p>
              <div className="flex items-baseline space-x-2">
                <p className="text-2xl font-bold">{formattedStats.revealedTickets}</p>
                <span className="text-sm text-gray-500">
                  ({Math.round(revealedPercentage)}%)
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-500">Total Participants</p>
              <p className="text-2xl font-bold">{stats.unique_participants.toLocaleString()}</p>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Instant Win Statistics */}
      <section aria-label="Instant Win Statistics">
        <Card>
          <CardContent className="pt-6">
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-500">Instant Win Eligible</p>
                <p className="text-2xl font-bold">{formattedStats.eligibleTickets}</p>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-500">Instant Wins Discovered</p>
                <div className="flex items-baseline space-x-2">
                  <p className="text-2xl font-bold">{formattedStats.instantWinsDiscovered}</p>
                  <span className="text-sm text-gray-500">
                    ({Math.round(instantWinPercentage)}%)
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Summary Statistics */}
      <section aria-label="Summary Statistics" className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-between items-center">
              <p className="text-sm font-medium text-gray-500">Ticket Reveal Rate</p>
              <p className="text-lg font-bold">{Math.round(revealedPercentage)}%</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-between items-center">
              <p className="text-sm font-medium text-gray-500">Instant Win Discovery Rate</p>
              <p className="text-lg font-bold">{Math.round(instantWinPercentage)}%</p>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
};

export default RaffleStatsPanel;