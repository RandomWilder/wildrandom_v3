// src/components/features/RaffleCard.tsx

import { FC, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../common/Card';
import Button from '../common/Button';
import { Timer, Trophy, Gift, ChevronRight } from '../common/icons';
import { motion } from 'framer-motion';
import type { Raffle } from '../../api/types';

interface RaffleCardProps {
  raffle: Raffle;
}

/**
 * RaffleCard Component
 * 
 * Displays a raffle in a card format with comprehensive details including:
 * - Prize values and distribution
 * - Time remaining information
 * - Sales progress
 * - Interactive elements
 * 
 * @component
 */
const RaffleCard: FC<RaffleCardProps> = ({ raffle }) => {
  const navigate = useNavigate();

  // Calculate derived values efficiently
  const {
    availableTickets,
    soldTickets,
    salesProgress,
    instantWinCount,
    drawWinCount,
    retailValue,
    timeStatus,
    formattedTimeStatus
  } = useMemo(() => {
    const available = raffle.available_tickets;
    const total = raffle.total_tickets;
    const sold = total - available;
    const progress = (sold / total) * 100;

    // Time status calculation
    const now = new Date();
    const endTime = new Date(raffle.end_time);
    const startTime = new Date(raffle.start_time);
    const isEnded = now > endTime;
    const hasStarted = now > startTime;

    let timeStatus: 'ended' | 'active' | 'upcoming' = 'active';
    let formattedTimeStatus = '';

    if (isEnded) {
      timeStatus = 'ended';
      formattedTimeStatus = 'Ended';
    } else if (!hasStarted) {
      timeStatus = 'upcoming';
      formattedTimeStatus = `in ${raffle.time_remaining.formatted_time_to_start}`;
    } else {
      timeStatus = 'active';
      formattedTimeStatus = `${raffle.time_remaining.formatted_time_to_end} left`;
    }

    return {
      availableTickets: available,
      soldTickets: sold,
      salesProgress: progress,
      instantWinCount: raffle.prize_pool_summary?.available_instances.instant_win ?? 0,
      drawWinCount: raffle.prize_pool_summary?.available_instances.draw_win ?? 0,
      retailValue: raffle.prize_pool_summary?.total_value.retail ?? 0,
      timeStatus,
      formattedTimeStatus
    };
  }, [raffle]);

  const handleViewDetails = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/raffles/${raffle.id}`);
  };

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      transition={{ type: "spring", stiffness: 300 }}
      className="h-full"
    >
      <Card 
        variant="default" 
        className="cursor-pointer overflow-hidden h-full flex flex-col"
      >
        <div className="space-y-4 p-6 flex-1">
          {/* Status Badge */}
          {timeStatus !== 'active' && (
            <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              timeStatus === 'ended' 
                ? 'bg-gray-100 text-gray-800'
                : 'bg-blue-100 text-blue-800'
            }`}>
              {timeStatus === 'ended' ? 'Ended' : 'Coming Soon'}
            </div>
          )}

          {/* Title and Prize Value */}
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">
              {raffle.title}
            </h3>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Trophy className="w-5 h-5 text-indigo-600" />
                <p className="text-2xl font-bold text-indigo-600">
                  ${retailValue.toLocaleString()}
                </p>
              </div>
              <div className="text-sm font-medium text-indigo-600">
                ${raffle.ticket_price} per ticket
              </div>
            </div>
          </div>

          {/* Description */}
          <p className="text-gray-600 text-sm line-clamp-2">
            {raffle.description}
          </p>

          {/* Progress Bar */}
          <div className="space-y-1">
            <div className="flex justify-between text-sm">
              <span className={`${timeStatus === 'ended' ? 'text-gray-500' : 'text-indigo-600'} font-medium`}>
                {timeStatus === 'ended' ? 'Completed' : `${Math.round(salesProgress)}% Sold`}
              </span>
              <span className="text-gray-500">
                {timeStatus === 'ended' 
                  ? `${soldTickets} tickets sold`
                  : `${availableTickets.toLocaleString()} tickets available`}
              </span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all duration-500 ${
                  timeStatus === 'ended' ? 'bg-gray-400' : 'bg-indigo-600'
                }`}
                style={{ width: `${Math.min(salesProgress, 100)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Footer Section */}
        <div className="px-6 py-4 bg-gray-50 space-y-4">
          {/* Timer and Prize Distribution */}
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center space-x-1 text-gray-500">
              <Timer className="w-4 h-4" />
              <span>{formattedTimeStatus}</span>
            </div>
            <div className="flex items-center space-x-3">
              {instantWinCount > 0 && (
                <div className="flex items-center space-x-1">
                  <Gift className="w-4 h-4 text-green-500" />
                  <span className="text-green-700 font-medium">
                    {instantWinCount} instant
                  </span>
                </div>
              )}
              {drawWinCount > 0 && (
                <div className="flex items-center space-x-1">
                  <Trophy className="w-4 h-4 text-indigo-500" />
                  <span className="text-indigo-700 font-medium">
                    {drawWinCount} draw
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* View Details Button */}
          <Button
            variant="ghost"
            onClick={handleViewDetails}
            className="w-full flex items-center justify-center space-x-2 text-indigo-600 hover:text-indigo-700"
          >
            <span>View Details</span>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </Card>
    </motion.div>
  );
};

export default RaffleCard;