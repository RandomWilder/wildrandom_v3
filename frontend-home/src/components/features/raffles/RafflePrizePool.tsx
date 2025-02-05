// src/components/features/raffles/RafflePrizePool.tsx

import { FC } from 'react';
import Card from '../../common/Card';
import { Gift, Trophy, CreditCard, DollarSign } from '../../common/icons';
import type { Raffle } from '../../../api/types';

interface RafflePrizePoolProps {
  raffle: Raffle;
  className?: string;
}

/**
 * RafflePrizePool Component
 * 
 * Displays comprehensive prize pool information including:
 * - Prize distribution (instant vs draw)
 * - Value breakdowns (retail, cash, credit)
 * - Availability status
 * 
 * @component
 * @example
 * ```tsx
 * <RafflePrizePool 
 *   raffle={raffleData} 
 *   className="mt-4"
 * />
 * ```
 */
const RafflePrizePool: FC<RafflePrizePoolProps> = ({ raffle, className = '' }) => {
  const prizePool = raffle.prize_pool_summary;
  
  if (!prizePool) {
    return null;
  }

  const {
    total_instances,
    available_instances,
    total_value: values
  } = prizePool;

  // Calculate remaining prizes
  const remainingInstant = available_instances.instant_win;
  const remainingDraw = available_instances.draw_win;
  const totalRemaining = remainingInstant + remainingDraw;
  const remainingPercentage = (totalRemaining / total_instances) * 100;

  // Value display config
  const valueTypes = [
    {
      type: 'retail',
      label: 'Retail Value',
      icon: Trophy,
      value: values.retail,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    },
    {
      type: 'cash',
      label: 'Cash Value',
      icon: DollarSign,
      value: values.cash,
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      type: 'credit',
      label: 'Credit Value',
      icon: CreditCard,
      value: values.credit,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    }
  ];

  return (
    <Card variant="default" className={className}>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">Prize Pool</h2>
          <div className="text-sm text-gray-500">
            {totalRemaining} prizes remaining
          </div>
        </div>

        {/* Prize Type Distribution */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Instant Win Section */}
          {remainingInstant > 0 && (
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-4">
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0">
                  <Gift className="w-8 h-8 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-green-900">
                    Instant Win Prizes
                  </p>
                  <p className="text-2xl font-bold text-green-700">
                    {remainingInstant} remaining
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Draw Win Section */}
          {remainingDraw > 0 && (
            <div className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-lg p-4">
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0">
                  <Trophy className="w-8 h-8 text-indigo-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-indigo-900">
                    Draw Win Prizes
                  </p>
                  <p className="text-2xl font-bold text-indigo-700">
                    {remainingDraw} remaining
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Prize Values */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900">Prize Values</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {valueTypes.map(({ type, label, icon: Icon, value, color, bgColor }) => (
              <div 
                key={type}
                className={`rounded-lg p-4 ${bgColor}`}
              >
                <div className="flex items-center space-x-3">
                  <Icon className={`w-6 h-6 ${color}`} />
                  <div>
                    <p className="text-sm font-medium text-gray-600">{label}</p>
                    <p className={`text-xl font-bold ${color}`}>
                      ${value.toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Progress Indicator */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-gray-600">
            <span>Prizes Claimed</span>
            <span>{Math.round(100 - remainingPercentage)}%</span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div 
              className="h-full bg-indigo-600 rounded-full transition-all duration-500"
              style={{ width: `${100 - remainingPercentage}%` }}
            />
          </div>
        </div>
      </div>
    </Card>
  );
};

export default RafflePrizePool;