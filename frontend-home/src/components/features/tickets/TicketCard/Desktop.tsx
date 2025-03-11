/**
 * Desktop Ticket Card Component
 * 
 * Primary gameplay element for ticket interactions:
 * - Rich reveal animations
 * - Prize discovery feedback
 * - Interactive state transitions
 * - Enhanced visual feedback
 */

import { FC, memo } from 'react';
import { motion } from 'framer-motion';
import { Trophy } from 'lucide-react';
import type { Ticket } from '../../../../features/tickets/types';

interface DesktopTicketCardLayoutProps {
  ticket: Ticket;
  isInteractive: boolean;
  onRevealTrigger?: () => void;
}

const DesktopTicketCardLayout: FC<DesktopTicketCardLayoutProps> = memo(({
  ticket,
  isInteractive,
  onRevealTrigger
}) => {
  // Interaction configuration for smooth gameplay
  const hoverConfig = {
    whileHover: isInteractive ? { 
      scale: 1.02,
      transition: { type: "spring", stiffness: 400, damping: 25 }
    } : undefined,
    className: `
      relative w-full p-6 
      bg-white rounded-xl shadow-sm
      ${isInteractive ? 'cursor-pointer hover:shadow-md' : ''}
      transform-gpu transition-all duration-200
    `
  };

  // Enhanced status display with animations
  const StatusDisplay = () => (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className={`
        absolute top-6 right-6 
        flex items-center space-x-2 px-3 py-1.5
        rounded-full text-sm font-medium
        ${ticket.reveal_time 
          ? 'bg-green-100 text-green-800' 
          : 'bg-indigo-100 text-indigo-800'}
      `}
    >
      <span className="relative">
        <span className={`
          absolute -left-1 -top-1 h-2 w-2 rounded-full
          ${isInteractive ? 'animate-ping bg-indigo-400' : ''}
        `} />
        <span className={`
          relative inline-flex h-2 w-2 rounded-full
          ${ticket.reveal_time ? 'bg-green-500' : 'bg-indigo-500'}
        `} />
      </span>
      <span>
        {ticket.reveal_time ? 'Revealed' : 'Click to reveal'}
      </span>
    </motion.div>
  );

  return (
    <motion.div
      {...hoverConfig}
      onClick={isInteractive ? onRevealTrigger : undefined}
    >
      {/* Primary Ticket Information */}
      <div className="flex flex-col space-y-3">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-xl font-semibold text-gray-900">
              #{ticket.ticket_number}
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              {ticket.purchase_time ? 
                `Purchased ${new Date(ticket.purchase_time).toLocaleDateString()}` :
                'Reserved'
              }
            </p>
          </div>
          <StatusDisplay />
        </div>

        {/* Instant Win Eligibility */}
        {ticket.instant_win_eligible && (
          <div className="mt-2 text-sm text-green-600 font-medium">
            Instant Win Eligible
          </div>
        )}

        {/* Prize Information */}
        {ticket.discovered_prize && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 p-4 bg-gradient-to-r from-indigo-50 to-white rounded-lg"
          >
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-600">
                Prize Value
              </span>
              <span className="text-lg font-bold text-indigo-600">
                ${ticket.discovered_prize.values.retail.toLocaleString()}
              </span>
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
});

DesktopTicketCardLayout.displayName = 'DesktopTicketCardLayout';

export default DesktopTicketCardLayout;