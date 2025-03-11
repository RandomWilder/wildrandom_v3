/**
 * Mobile Ticket Card Component
 * 
 * Touch-optimized gameplay element featuring:
 * - Tactile feedback animations
 * - Swipe interactions
 * - Progressive reveals
 * - Haptic integration points
 */

import { FC, memo } from 'react';
import { motion } from 'framer-motion';
import type { Ticket } from '../../../../features/tickets/types';

interface MobileTicketCardLayoutProps {
  ticket: Ticket;
  isInteractive: boolean;
  onRevealTrigger?: () => void;
}

const MobileTicketCardLayout: FC<MobileTicketCardLayoutProps> = memo(({
  ticket,
  isInteractive,
  onRevealTrigger
}) => {
  // Update touch-optimized interaction config
  const touchConfig = {
    whileTap: isInteractive ? { scale: 0.98 } : undefined,
    className: `
      relative w-[92vw] mx-auto min-h-[120px] p-3 
      bg-white rounded-xl shadow-sm 
      ${isInteractive ? 'touch-manipulation active:bg-gray-50' : ''}
      transform-gpu transition-colors duration-150
    `
  };

  // Status indicator with reveal animations
  const StatusIndicator = () => (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={`
        absolute top-3 right-3 px-2 py-1 
        rounded-full text-xs font-medium
        ${ticket.reveal_time 
          ? 'bg-green-100 text-green-800' 
          : ticket.instant_win_eligible
            ? 'bg-amber-100 text-amber-800'
            : 'bg-gray-100 text-gray-800'
        }
      `}
    >
      {ticket.reveal_time 
        ? 'Revealed' 
        : ticket.instant_win_eligible
          ? 'Instant Win'
          : 'Tap to reveal'
      }
    </motion.div>
  );

  return (
    <motion.div
      {...touchConfig}
      onClick={isInteractive ? onRevealTrigger : undefined}
    >
      {/* Primary Ticket Information */}
      <div className="flex flex-col">
        <span className="text-lg font-medium text-gray-900">
          #{ticket.ticket_number}
        </span>
        <span className="mt-1 text-sm text-gray-500">
          {ticket.purchase_time ? 
            `Purchased ${new Date(ticket.purchase_time).toLocaleDateString()}` :
            'Reserved'
          }
        </span>
      </div>

      <StatusIndicator />
      
      {/* Prize Preview with Animation */}
      {ticket.discovered_prize && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-3 flex items-center justify-between"
        >
          <span className="text-sm font-medium text-indigo-600">
            Prize Value
          </span>
          <span className="text-sm font-bold text-indigo-600">
            ${ticket.discovered_prize.values.retail.toLocaleString()}
          </span>
        </motion.div>
      )}

      {/* Claim Status */}
      {ticket.claim_status?.claimed && (
        <div className="mt-2 text-xs text-green-600 font-medium">
          Claimed {ticket.claim_status.claim_time && 
            new Date(ticket.claim_status.claim_time).toLocaleDateString()
          }
        </div>
      )}
    </motion.div>
  );
});

MobileTicketCardLayout.displayName = 'MobileTicketCardLayout';

export default MobileTicketCardLayout;