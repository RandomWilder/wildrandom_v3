// src/components/raffle/RaffleCard.tsx
import React from 'react';
import { useRouter } from 'next/router';
import { Clock, DollarSign, Users } from 'lucide-react';
import type { Raffle } from '@/types/raffle';

interface RaffleCardProps {
  raffle: Raffle;
}

export const RaffleCard: React.FC<RaffleCardProps> = ({ raffle }) => {
  const router = useRouter();

  return (
    <div className="
      bg-surface-card border border-gray-800 rounded-xl overflow-hidden
      hover:border-game-500/50 transition-all duration-200 ease-gaming
      hover:transform hover:-translate-y-1 hover:shadow-lg hover:shadow-game-500/10
      cursor-pointer
    ">
      <div className="p-4">
        <h3 className="text-lg font-bold text-white mb-2">{raffle.title}</h3>
        
        <div className="space-y-3">
          {/* Prize Pool Summary */}
          {raffle.prize_pool_summary && (
            <div className="flex items-center text-sm text-gray-400">
              <DollarSign className="w-4 h-4 mr-2 text-game-400" />
              <span>Total Value: ${raffle.prize_pool_summary.total_value.retail.toLocaleString()}</span>
            </div>
          )}

          {/* Ticket Info */}
          <div className="flex items-center text-sm text-gray-400">
            <Users className="w-4 h-4 mr-2 text-game-400" />
            <span>{raffle.total_tickets.toLocaleString()} Total Tickets</span>
          </div>

          {/* Time Remaining */}
          <div className="flex items-center text-sm text-gray-400">
            <Clock className="w-4 h-4 mr-2 text-game-400" />
            <span>{raffle.time_remaining.formatted_time_to_end}</span>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-gray-800">
          <button 
            onClick={() => router.push(`/raffles/${raffle.id}`)}
            className="
              w-full py-2 px-4 bg-game-500 text-white rounded-lg 
              hover:bg-game-600 transition-colors duration-200 ease-gaming
              transform hover:scale-[1.02] active:scale-[0.98]
            "
          >
            View Details
          </button>
        </div>
      </div>
    </div>
  );
};