// src/components/raffles/admin/tabs/RaffleDrawsTab.tsx

import { useEffect, useState } from 'react';
import { Trophy, AlertCircle, Clock } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/ui/loading';
import { useRaffleStore } from '@/stores/raffleStore';
import type { DrawResult } from '@/types/raffles';
import { formatDate } from '@/utils/date';
import { formatCurrency } from '@/utils/currency';

interface RaffleDrawsTabProps {
  raffleId: number;
  canExecuteDraw: boolean;
}

export const RaffleDrawsTab: React.FC<RaffleDrawsTabProps> = ({
  raffleId,
  canExecuteDraw
}) => {
  const {
    drawResults,
    isExecutingDraw,
    drawError,
    executeDraw,
    loadDrawResults
  } = useRaffleStore();

  const [isConfirmingDraw, setIsConfirmingDraw] = useState(false);

  // Load initial draw results
  useEffect(() => {
    loadDrawResults(raffleId);
  }, [raffleId, loadDrawResults]);

  // Execute draw with confirmation
  const handleDrawExecution = async () => {
    try {
      await executeDraw(raffleId);
      await loadDrawResults(raffleId); // Refresh results after draw
      setIsConfirmingDraw(false);
    } catch (error) {
      console.error('Draw execution failed:', error);
    }
  };

  // Draw results grouping by sequence
  const drawsBySequence = drawResults.reduce<Record<number, DrawResult[]>>((acc, draw) => {
    if (!acc[draw.draw_sequence]) {
      acc[draw.draw_sequence] = [];
    }
    acc[draw.draw_sequence].push(draw);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      {/* Draw Execution Controls */}
      {canExecuteDraw && (
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium text-gray-900">Draw Execution</h3>
              <p className="mt-1 text-sm text-gray-500">
                Execute the raffle draw to determine winners
              </p>
            </div>
            {isConfirmingDraw ? (
              <div className="flex items-center space-x-4">
                <Button
                  variant="outline"
                  onClick={() => setIsConfirmingDraw(false)}
                  disabled={isExecutingDraw}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleDrawExecution}
                  disabled={isExecutingDraw}
                >
                  {isExecutingDraw ? (
                    <>
                      <LoadingSpinner className="mr-2" />
                      Executing Draw...
                    </>
                  ) : (
                    'Confirm Draw'
                  )}
                </Button>
              </div>
            ) : (
              <Button
                onClick={() => setIsConfirmingDraw(true)}
                disabled={isExecutingDraw}
              >
                <Trophy className="w-4 h-4 mr-2" />
                Execute Draw
              </Button>
            )}
          </div>
        </Card>
      )}

      {/* Error Display */}
      {drawError && (
        <Card className="border-red-200 bg-red-50">
          <div className="p-4 flex items-start space-x-3">
            <AlertCircle className="h-5 w-5 text-red-400 mt-0.5" />
            <div>
              <h3 className="text-sm font-medium text-red-800">Draw Error</h3>
              <p className="mt-1 text-sm text-red-600">{drawError}</p>
            </div>
          </div>
        </Card>
      )}

      {/* Draw Results */}
      <div className="space-y-6">
        {Object.entries(drawsBySequence).map(([sequence, draws]) => (
          <Card key={sequence} className="overflow-hidden">
            <div className="p-4 bg-gray-50 border-b">
              <h3 className="font-medium text-gray-900">
                Draw Sequence #{sequence}
              </h3>
            </div>
            <div className="divide-y divide-gray-200">
              {draws.map((draw) => (
                <div key={draw.id} className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* Ticket Information */}
                    <div>
                      <h4 className="text-sm font-medium text-gray-500">Ticket</h4>
                      <div className="mt-2 space-y-1">
                        <p className="font-mono text-sm">
                          {draw.ticket_details?.number}
                        </p>
                        {draw.ticket_details?.user_id && (
                          <p className="text-sm text-gray-500">
                            User ID: {draw.ticket_details.user_id}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Prize Details */}
                    {draw.prize_details && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-500">Prize</h4>
                        <div className="mt-2 space-y-1">
                          <p className="text-sm">
                            {draw.prize_details.type === 'instant_win' ? 
                              'Instant Win' : 'Draw Win'}
                          </p>
                          <p className="text-sm text-gray-500">
                            ID: {draw.prize_details.instance_id}
                          </p>
                          <div className="mt-2 space-y-0.5">
                            <p className="text-sm">
                              Retail: {formatCurrency(draw.prize_details.values.retail)}
                            </p>
                            <p className="text-sm text-gray-500">
                              Cash: {formatCurrency(draw.prize_details.values.cash)}
                            </p>
                            <p className="text-sm text-gray-500">
                              Credit: {formatCurrency(draw.prize_details.values.credit)}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Timing Information */}
                    <div>
                      <h4 className="text-sm font-medium text-gray-500">Timing</h4>
                      <div className="mt-2 space-y-2">
                        <div className="flex items-center text-sm text-gray-500">
                          <Clock className="h-4 w-4 mr-2" />
                          Drawn: {formatDate(draw.drawn_at)}
                        </div>
                        {draw.processed_at && (
                          <div className="flex items-center text-sm text-gray-500">
                            <Clock className="h-4 w-4 mr-2" />
                            Processed: {formatDate(draw.processed_at)}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        ))}

        {/* Empty State */}
        {drawResults.length === 0 && (
          <div className="text-center py-12">
            <Trophy className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No Draws Yet</h3>
            <p className="mt-1 text-sm text-gray-500">
              {canExecuteDraw ? 
                'Execute the draw to determine winners' : 
                'Draws will be available when the raffle ends'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};