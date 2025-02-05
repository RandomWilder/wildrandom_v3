// src/components/features/raffles/RaffleProgress.tsx

import { FC, useMemo } from 'react';
import Card from '../../common/Card';
import { Ticket, Tag, ChartBar } from '../../common/icons';
import type { Raffle } from '../../../api/types';

interface RaffleProgressProps {
  raffle: Raffle;
  className?: string;
}

const RaffleProgress: FC<RaffleProgressProps> = ({ raffle, className = '' }) => {
  const {
    ticketsSold,
    ticketsRemaining,
    ticketPrice,
    salesProgress,
    totalValue
  } = useMemo(() => {
    const remaining = raffle.available_tickets;
    const total = raffle.total_tickets;
    const sold = total - remaining;
    
    return {
      ticketsSold: sold,
      ticketsRemaining: remaining,
      ticketPrice: raffle.ticket_price,
      salesProgress: (sold / total) * 100,
      totalValue: sold * raffle.ticket_price
    };
  }, [raffle]);

  const statistics = [
    {
      icon: Ticket,
      label: 'Tickets Sold',
      value: ticketsSold.toLocaleString(),
      subtext: `$${totalValue.toLocaleString()} total value`,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50'
    },
    {
      icon: Tag,  // Changed from Users to Tag for ticket inventory
      label: 'Tickets Remaining',
      value: ticketsRemaining.toLocaleString(),
      subtext: `$${ticketPrice} per ticket`,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      icon: ChartBar,  // Changed from CheckCircle to ChartBar for progress
      label: 'Sales Progress',
      value: `${Math.round(salesProgress)}%`,
      subtext: 'Of total tickets',
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    }
  ];

  return (
    <Card variant="default" className={className}>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">
            Ticket Sales Progress
          </h2>
          <div className="text-sm text-gray-500">
            {raffle.total_tickets.toLocaleString()} total tickets
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {statistics.map(({ icon: Icon, label, value, subtext, color, bgColor }) => (
            <div 
              key={label}
              className={`rounded-lg p-4 ${bgColor}`}
            >
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  <Icon className={`w-6 h-6 ${color}`} />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">{label}</p>
                  <p className={`text-2xl font-bold ${color}`}>{value}</p>
                  <p className="text-sm text-gray-600 mt-1">{subtext}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-sm text-gray-600">
            <span>Overall Progress</span>
            <span>{ticketsSold.toLocaleString()} of {raffle.total_tickets.toLocaleString()} tickets sold</span>
          </div>
          <div className="h-4 bg-gray-100 rounded-full overflow-hidden">
            <div 
              className="h-full bg-indigo-600 rounded-full transition-all duration-500"
              style={{ width: `${salesProgress}%` }}
            />
          </div>
        </div>

        {raffle.state === 'open' && (
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="text-sm text-gray-600">
              <span className="font-medium">Time Remaining: </span>
              {Math.floor(raffle.time_remaining.seconds_to_end / 3600)} hours
            </div>
            <div className="text-sm text-gray-600 md:text-right">
              <span className="font-medium">Sales Rate: </span>
              {(ticketsSold / Math.max(1, raffle.total_tickets * 0.1)).toFixed(2)} tickets/hour
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};

export default RaffleProgress;