/**
 * TicketGroup Component
 * 
 * Orchestrates grouped ticket display with:
 * - Dynamic expansion animations
 * - Progressive reveal sequences
 * - Raffle status indicators
 * - Performance-optimized rendering
 */

import { FC, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import Card from '../../../common/Card';
import type { TicketGroup as TicketGroupType } from '../../../../features/tickets/types';

interface TicketGroupProps {
  group: TicketGroupType;
  className?: string;
}

// Animation variants for smooth transitions
const EXPAND_ANIMATION = {
  initial: { height: 0, opacity: 0 },
  animate: { 
    height: "auto", 
    opacity: 1,
    transition: {
      height: {
        type: "spring",
        stiffness: 500,
        damping: 30
      },
      opacity: {
        duration: 0.2
      }
    }
  },
  exit: { 
    height: 0, 
    opacity: 0,
    transition: {
      height: {
        type: "spring",
        stiffness: 500,
        damping: 30
      },
      opacity: {
        duration: 0.2
      }
    }
  }
};

const TicketGroup: FC<TicketGroupProps> = ({ group, className = '' }) => {
  const [isExpanded, setIsExpanded] = useState(true);

  // Compute group statistics
  const stats = useMemo(() => {
    const total = group.tickets.length;
    const revealed = group.tickets.filter(t => t.reveal_time !== null).length;
    const unrevealed = total - revealed;

    return {
      total,
      revealed,
      unrevealed,
      instantWinEligible: group.tickets.filter(t => t.instant_win_eligible).length
    };
  }, [group.tickets]);

  // Format time display
  const formattedEndTime = useMemo(() => {
    return new Date(group.raffle.end_time).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }, [group.raffle.end_time]);

  // Compute raffle status
  const isActive = useMemo(() => 
    new Date(group.raffle.end_time) > new Date(), 
    [group.raffle.end_time]
  );

  return (
    <Card 
      variant={isActive ? 'featured' : 'default'}
      className={`overflow-hidden ${className}`}
    >
      {/* Group Header */}
      <motion.div
        className="cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="p-4 flex items-center justify-between">
          <div className="space-y-1">
            <h3 className="text-lg font-semibold text-gray-900">
              {group.raffle.title}
            </h3>
            <div className="text-sm text-gray-500 space-x-2">
              <span>{stats.total} tickets</span>
              <span>•</span>
              <span>Ends {formattedEndTime}</span>
            </div>
            {/* Status Indicators */}
            <div className="flex items-center space-x-3 mt-1">
              {stats.instantWinEligible > 0 && (
                <span className="text-xs font-medium text-green-600">
                  {stats.instantWinEligible} Instant Win Eligible
                </span>
              )}
              {stats.unrevealed > 0 && (
                <span className="text-xs font-medium text-indigo-600">
                  {stats.unrevealed} Ready to Reveal
                </span>
              )}
            </div>
          </div>
          <motion.div
            animate={{ rotate: isExpanded ? 180 : 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="flex-shrink-0"
          >
            <ChevronDown className="w-5 h-5 text-gray-400" />
          </motion.div>
        </div>
      </motion.div>

      {/* Tickets Grid */}
      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            variants={EXPAND_ANIMATION}
            initial="initial"
            animate="animate"
            exit="exit"
          >
            <div className="px-4 pb-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {group.tickets.map(ticket => (
                <div 
                  key={ticket.ticket_id}
                  className="p-4 bg-gray-50 rounded-lg touch-manipulation"
                >
                  <div className="flex justify-between items-center">
                    <span className="font-medium">{ticket.ticket_number}</span>
                    <span className="text-sm text-gray-500">
                      {ticket.reveal_time ? 'Revealed' : 'Not Revealed'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
};

export default TicketGroup;