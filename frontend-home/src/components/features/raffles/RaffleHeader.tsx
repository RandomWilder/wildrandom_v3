// src/components/features/raffles/RaffleHeader.tsx

import { FC } from 'react';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { Timer, Trophy, ArrowLeft } from '../../common/icons';
import type { Raffle } from '../../../api/types';

interface RaffleHeaderProps {
  raffle: Raffle;
}

/**
 * RaffleHeader Component
 * 
 * Displays primary raffle information including:
 * - Title and description
 * - Prize pool value
 * - Time remaining
 * - Status indicators
 * 
 * Features:
 * - Responsive layout for all screen sizes
 * - Dynamic status styling
 * - Animated value displays
 * - Back navigation
 */
const RaffleHeader: FC<RaffleHeaderProps> = ({ raffle }) => {
  // Calculate time remaining with proper timezone handling
  const timeRemaining = raffle.state === 'open' ? 
    raffle.time_remaining.seconds_to_end : 
    raffle.time_remaining.seconds_to_start;

  const formattedTimeRemaining = formatDistanceToNow(
    new Date(Date.now() + timeRemaining * 1000),
    { addSuffix: true }
  );

  // Get total prize value from pool
  const totalValue = raffle.prize_pool_summary?.total_value.retail ?? 0;

  // Status badge styling
  const getStatusStyles = () => {
    switch (raffle.state) {
      case 'open':
        return 'bg-green-100 text-green-800';
      case 'coming_soon':
        return 'bg-blue-100 text-blue-800';
      case 'ended':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Back Navigation */}
      <Link 
        to="/" 
        className="inline-flex items-center space-x-2 text-gray-600 hover:text-gray-900"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Raffles</span>
      </Link>

      <div className="space-y-4">
        {/* Title Section */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
          <div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900">
              {raffle.title}
            </h1>
            {/* Status Badge */}
            <div className={`mt-2 inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusStyles()}`}>
              {raffle.state.replace('_', ' ').charAt(0).toUpperCase() + raffle.state.slice(1)}
            </div>
          </div>

          {/* Prize Value */}
          <div className="flex items-center space-x-3 bg-indigo-50 rounded-lg p-4">
            <Trophy className="w-8 h-8 text-indigo-600" />
            <div>
              <p className="text-sm text-indigo-700 font-medium">Total Prize Value</p>
              <p className="text-2xl sm:text-3xl font-bold text-indigo-600">
                ${totalValue.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        {/* Description & Time Remaining */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <p className="text-gray-600 text-lg">
              {raffle.description}
            </p>
          </div>
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex items-center space-x-3">
                <Timer className="w-6 h-6 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">
                    {raffle.state === 'open' ? 'Ends' : 'Starts'}
                  </p>
                  <p className="text-lg font-semibold text-gray-900">
                    {formattedTimeRemaining}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RaffleHeader;