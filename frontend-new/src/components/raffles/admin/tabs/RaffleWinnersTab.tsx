// src/components/raffles/admin/tabs/RaffleWinnersTab.tsx
import React, { useEffect, useMemo } from 'react';
import { Trophy, AlertCircle, DollarSign, Clock } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { LoadingSpinner } from '@/components/ui/loading';
import { useRaffleStore } from '@/stores/raffleStore';
import type { DrawResult } from '@/types/raffles';
import { formatDate } from '@/utils/date';
import { formatCurrency } from '@/utils/currency';

interface RaffleWinnersTabProps {
  raffleId: number;
}

export const RaffleWinnersTab: React.FC<RaffleWinnersTabProps> = ({ raffleId }) => {
  const {
    winners,
    isLoading,
    error,
    loadWinners
  } = useRaffleStore();

  // Load winners data when tab is mounted
  useEffect(() => {
    loadWinners(raffleId);
  }, [raffleId, loadWinners]);

  // Calculate aggregate statistics safely
  const stats = useMemo(() => {
    if (!winners?.length) return null;
    
    return winners.reduce((acc, winner) => {
      if (!winner.prize_details) return acc;

      return {
        totalWinners: acc.totalWinners + 1,
        totalRetailValue: acc.totalRetailValue + winner.prize_details.values.retail,
        totalCashValue: acc.totalCashValue + winner.prize_details.values.cash,
        totalCreditValue: acc.totalCreditValue + winner.prize_details.values.credit,
        prizeTypes: {
          ...acc.prizeTypes,
          [winner.prize_details.type]: (acc.prizeTypes[winner.prize_details.type] || 0) + 1
        }
      };
    }, {
      totalWinners: 0,
      totalRetailValue: 0,
      totalCashValue: 0,
      totalCreditValue: 0,
      prizeTypes: {} as Record<string, number>
    });
  }, [winners]);

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-red-200 bg-red-50">
        <div className="p-4 flex items-start space-x-3">
          <AlertCircle className="h-5 w-5 text-red-400 mt-0.5" />
          <div>
            <h3 className="text-sm font-medium text-red-800">Error Loading Winners</h3>
            <p className="mt-1 text-sm text-red-600">{error}</p>
          </div>
        </div>
      </Card>
    );
  }

  if (!winners?.length) {
    return (
      <div className="text-center py-12">
        <Trophy className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">No Winners Yet</h3>
        <p className="mt-1 text-sm text-gray-500">
          Winners will be displayed here after the raffle draw is completed
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Winners Statistics */}
      {stats && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="p-4">
            <h3 className="text-sm font-medium text-gray-500">Total Winners</h3>
            <p className="mt-2 text-3xl font-semibold text-gray-900">
              {stats.totalWinners}
            </p>
          </Card>

          <Card className="p-4">
            <h3 className="text-sm font-medium text-gray-500">Total Prize Value</h3>
            <p className="mt-2 text-3xl font-semibold text-gray-900">
              {formatCurrency(stats.totalRetailValue)}
            </p>
          </Card>

          <Card className="p-4">
            <h3 className="text-sm font-medium text-gray-500">Total Cash Value</h3>
            <p className="mt-2 text-3xl font-semibold text-gray-900">
              {formatCurrency(stats.totalCashValue)}
            </p>
          </Card>

          <Card className="p-4">
            <h3 className="text-sm font-medium text-gray-500">Total Credit Value</h3>
            <p className="mt-2 text-3xl font-semibold text-gray-900">
              {formatCurrency(stats.totalCreditValue)}
            </p>
          </Card>
        </div>
      )}

      {/* Winners List */}
      <div className="space-y-4">
        {winners.map((winner) => (
          <Card key={winner.draw_sequence} className="overflow-hidden">
            <div className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Winner Information */}
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-2">Winner Details</h4>
                  <div className="space-y-2">
                    <div className="flex items-center">
                      <Trophy className="h-4 w-4 text-amber-500 mr-2" />
                      <span className="text-sm font-medium">
                        Draw #{winner.draw_sequence}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">
                      Ticket: {winner.ticket_details?.number}
                    </p>
                    {winner.ticket_details?.user_id && (
                      <p className="text-sm text-gray-600">
                        User ID: {winner.ticket_details.user_id}
                      </p>
                    )}
                  </div>
                </div>

                {/* Prize Information */}
                {winner.prize_details && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 mb-2">Prize Details</h4>
                    <div className="space-y-2">
                      <p className="text-sm font-medium">
                        {winner.prize_details.type === 'instant_win' ? 
                          'Instant Win Prize' : 'Draw Win Prize'}
                      </p>
                      <div className="space-y-1">
                        <div className="flex items-center text-sm">
                          <DollarSign className="h-4 w-4 text-green-500 mr-1" />
                          Retail: {formatCurrency(winner.prize_details.values.retail)}
                        </div>
                        <div className="flex items-center text-sm text-gray-500">
                          <DollarSign className="h-4 w-4 mr-1" />
                          Cash: {formatCurrency(winner.prize_details.values.cash)}
                        </div>
                        <div className="flex items-center text-sm text-gray-500">
                          <DollarSign className="h-4 w-4 mr-1" />
                          Credit: {formatCurrency(winner.prize_details.values.credit)}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Draw Timing */}
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-2">Timing</h4>
                  <div className="space-y-2">
                    <div className="flex items-center text-sm text-gray-600">
                      <Clock className="h-4 w-4 mr-2" />
                      Drawn: {formatDate(winner.drawn_at)}
                    </div>
                    {winner.processed_at && (
                      <div className="flex items-center text-sm text-gray-600">
                        <Clock className="h-4 w-4 mr-2" />
                        Processed: {formatDate(winner.processed_at)}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default RaffleWinnersTab;