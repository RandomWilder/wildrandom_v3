import { FC, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Timer, Ticket } from 'lucide-react';
import Card from '../../../common/Card';
import type { TicketGroup } from '../../../../api/types/ticketGroups';

interface TicketGroupCardProps {
  group: TicketGroup;
  className?: string;
}

const TicketGroupCard: FC<TicketGroupCardProps> = ({ 
  group,
  className = ''
}) => {
  const navigate = useNavigate();

  const metrics = useMemo(() => ({
    hasUnrevealed: group.unrevealed_tickets > 0,
    completionRate: group.participation_status.revealed_percentage,
    timeRemaining: group.time_remaining.formatted_time_to_end
  }), [group]);

  const handleClick = () => {
    navigate(`/raffles/${group.raffle_id}/tickets`);
  };

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: "spring", stiffness: 400, damping: 17 }}
    >
      <Card
        variant={metrics.hasUnrevealed ? 'featured' : 'default'}
        className={`cursor-pointer ${className}`}
        onClick={handleClick}
      >
        <div className="p-4 space-y-3">
          {/* Title and Status */}
          <div className="flex justify-between items-start">
            <h3 className="text-lg font-semibold text-gray-900 line-clamp-1">
              {group.title}
            </h3>
            {metrics.hasUnrevealed && (
              <span className="px-2 py-1 bg-indigo-100 text-indigo-700 text-sm font-medium rounded-full">
                {group.unrevealed_tickets} unrevealed
              </span>
            )}
          </div>

          {/* Progress Bar */}
          <div className="space-y-1">
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div 
                className="h-full bg-indigo-600 transition-all duration-500"
                style={{ width: `${metrics.completionRate}%` }}
              />
            </div>
            <div className="flex justify-between text-sm text-gray-500">
              <span>{group.total_tickets} tickets total</span>
              <span>{Math.round(metrics.completionRate)}% revealed</span>
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-between items-center pt-2 border-t border-gray-100">
            <div className="flex items-center space-x-1 text-sm text-gray-500">
              <Timer className="w-4 h-4" />
              <span>{metrics.timeRemaining}</span>
            </div>
            {group.card_metrics.action_required && (
              <div className="flex items-center text-sm font-medium text-indigo-600">
                <Ticket className="w-4 h-4 mr-1" />
                View Tickets
              </div>
            )}
          </div>
        </div>
      </Card>
    </motion.div>
  );
};

export default TicketGroupCard;