// src/components/features/raffles/RaffleStats.tsx

import { FC } from 'react';
import Card from '../../common/Card';
import { Users, CheckCircle, Clock } from '../../common/icons';
import type { Raffle } from '../../../api/types';

interface RaffleStatsProps {
  raffle: Raffle;
  className?: string;
}

const RaffleStats: FC<RaffleStatsProps> = ({ raffle, className = '' }) => {
  // Calculate participation stats
  const totalParticipants = raffle.prize_pool_summary?.available_instances.draw_win ?? 0;
  const revealedTickets = totalParticipants > 0 ? 
    Math.floor(totalParticipants * 0.8) : 0; // Placeholder until API integration

  // Format dates consistently
  const startDate = new Date(raffle.start_time);
  const endDate = new Date(raffle.end_time);
  const formattedStart = startDate.toLocaleDateString('en-US', { 
    month: 'long', 
    day: 'numeric', 
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
  const formattedEnd = endDate.toLocaleDateString('en-US', { 
    month: 'long', 
    day: 'numeric', 
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  // Stats configuration
  const statsItems = [
    {
      icon: Users,
      label: 'Total Participants',
      value: totalParticipants.toLocaleString(),
      color: 'text-blue-600'
    },
    {
      icon: CheckCircle,
      label: 'Tickets Revealed',
      value: revealedTickets.toLocaleString(),
      color: 'text-green-600'
    },
    {
      icon: Clock,
      label: 'Duration',
      value: `${Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60))} hours`,
      color: 'text-indigo-600'
    }
  ];

  return (
    <Card variant="default" className={className}>
      <div className="p-6 space-y-6">
        <h2 className="text-xl font-semibold text-gray-900">
          Raffle Statistics
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {statsItems.map(({ icon: Icon, label, value, color }) => (
            <div key={label} className="flex items-center space-x-4">
              <div className={`rounded-lg p-3 ${color} bg-opacity-10`}>
                <Icon className={`w-6 h-6 ${color}`} />
              </div>
              <div>
                <p className="text-sm text-gray-600">{label}</p>
                <p className="text-lg font-semibold text-gray-900">{value}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="border-t border-gray-200 pt-6">
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-gray-900">
              Schedule Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-600">Start Time</p>
                <p className="font-medium text-gray-900">{formattedStart}</p>
              </div>
              <div>
                <p className="text-gray-600">End Time</p>
                <p className="font-medium text-gray-900">{formattedEnd}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default RaffleStats;