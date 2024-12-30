// Path: src/components/raffles/admin/RaffleDraws.tsx

import { useEffect, useState } from 'react';
import { Trophy, AlertCircle } from 'lucide-react';
import { useRaffleStore } from '@/stores/raffleStore';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/ui/loading';
import type { DrawResult } from '@/types/raffles';
import { formatDate } from '@/utils/date';
import { formatCurrency } from '@/utils/currency';

interface RaffleDrawsProps {
  raffleId: number;
  canExecuteDraw: boolean;
  onExecuteDraw: () => Promise<void>;
}

export function RaffleDraws({ 
  raffleId, 
  canExecuteDraw,
  onExecuteDraw 
}: RaffleDrawsProps) {
  const { drawResults, winners, isExecutingDraw, drawError, loadDrawResults } = useRaffleStore();
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadDrawResults(raffleId);
  }, [raffleId, loadDrawResults]);

  const handleExecuteDraw = async () => {
    setIsLoading(true);
    try {
      await onExecuteDraw();
      await loadDrawResults(raffleId);
    } catch (error) {
      console.error('Failed to execute draw:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Execute Draw Button */}
      {canExecuteDraw && (
        <div className="flex justify-end">
          <Button
            onClick={handleExecuteDraw}
            disabled={isExecutingDraw}
          >
            {isExecutingDraw ? (
              <>
                <LoadingSpinner className="mr-2" />
                Executing Draw...
              </>
            ) : (
              <>
                <Trophy className="w-4 h-4 mr-2" />
                Execute Draw
              </>
            )}
          </Button>
        </div>
      )}

      {/* Error Display */}
      {drawError && (
        <div className="rounded-lg bg-red-50 p-4">
          <div className="flex">
            <AlertCircle className="h-5 w-5 text-red-400" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Draw Error</h3>
              <p className="mt-2 text-sm text-red-700">{drawError}</p>
            </div>
          </div>
        </div>
      )}

      {/* Draw Results Table */}
      {drawResults.length > 0 ? (
        <div className="overflow-x-auto rounded-lg border border-gray-200">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Draw Sequence
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Ticket Number
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Prize Details
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  Value
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  Drawn At
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {drawResults.map((draw) => (
                <tr key={draw.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    #{draw.draw_sequence}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">
                    {draw.ticket_details?.number}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {draw.prize_details ? (
                      <div>
                        <span className="font-medium">
                          {draw.prize_details.type === 'instant_win' ? 'Instant Win' : 'Draw Win'}
                        </span>
                        <span className="text-gray-500 ml-2">
                          ID: {draw.prize_details.instance_id}
                        </span>
                      </div>
                    ) : (
                      'No prize details'
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                    {draw.prize_details ? (
                      <div>
                        <div className="font-medium">
                          {formatCurrency(draw.prize_details.values.retail)}
                        </div>
                        <div className="text-xs text-gray-500">
                          Cash: {formatCurrency(draw.prize_details.values.cash)}
                        </div>
                      </div>
                    ) : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                    {formatDate(draw.drawn_at)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-12 text-gray-500">
          No draws have been executed yet.
        </div>
      )}
    </div>
  );
}

export default RaffleDraws;