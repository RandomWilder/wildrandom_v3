import { FC, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Timer, Ticket } from 'lucide-react';
import Card from '../../common/Card';
import type { TicketGroup } from '../../../api/types/ticketGroups';

interface TicketGroupCardProps {
  group: TicketGroup;
  className?: string;
}

const TicketGroupCard: FC<TicketGroupCardProps> = ({ 
  group,
  className = ''
}) => {
  const navigate = useNavigate();
  const cardRef = useRef<HTMLDivElement>(null);
  const [isInteractive, setIsInteractive] = useState(true);
  
  // Metrics calculation
  const metrics = {
    hasUnrevealed: group.unrevealed_tickets > 0,
    completionRate: group.participation_status.revealed_percentage,
    timeRemaining: group.time_remaining.formatted_time_to_end
  };

  // Enhanced navigation handlers with multiple fallbacks
  const handleCardClick = () => {
    console.log(`Navigating to: /raffles/${group.raffle_id}/tickets`);
    // Attempt programmatic navigation
    navigate(`/raffles/${group.raffle_id}/tickets`);
    
    // Fallback: Direct URL manipulation if navigation fails
    setTimeout(() => {
      if (window.location.pathname !== `/raffles/${group.raffle_id}/tickets`) {
        window.location.href = `/raffles/${group.raffle_id}/tickets`;
      }
    }, 100);
  };

  // DOM monitoring for interaction capabilities
  useEffect(() => {
    if (cardRef.current) {
      // Check if element is properly interactive
      const styles = window.getComputedStyle(cardRef.current);
      const hasPointerEvents = styles.pointerEvents !== 'none';
      setIsInteractive(hasPointerEvents);
      
      // Setup diagnostic event listener
      const element = cardRef.current;
      const diagnosticHandler = () => console.log("Card click detected");
      element.addEventListener('click', diagnosticHandler);
      
      return () => {
        element.removeEventListener('click', diagnosticHandler);
      };
    }
  }, []);

  return (
    <div 
      ref={cardRef}
      className="relative w-full" 
      onClick={handleCardClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          handleCardClick();
        }
      }}
      style={{ cursor: 'pointer' }}
    >
      {/* Additional click surface with high z-index to guarantee clickability */}
      <div 
        className="absolute inset-0 z-10 cursor-pointer" 
        onClick={handleCardClick}
        aria-hidden="true"
      />
      
      <motion.div
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        transition={{ type: "spring", stiffness: 400, damping: 17 }}
        className="relative z-0"
      >
        <Card
          variant={metrics.hasUnrevealed ? 'featured' : 'default'}
          className={`w-full ${className}`}
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
      
      {!isInteractive && (
        <div className="absolute bottom-1 right-1 text-xs text-red-500 bg-white px-1 rounded z-20">
          Clickability issue detected
        </div>
      )}
    </div>
  );
};

export default TicketGroupCard;