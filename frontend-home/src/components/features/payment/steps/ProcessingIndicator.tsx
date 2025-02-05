/**
 * Processing Indicator Component
 * 
 * Provides visual feedback during transaction processing with proper
 * state management and error handling. Implements loading animations
 * and status updates aligned with backend processing states.
 * 
 * Architectural Considerations:
 * - Real-time status updates
 * - Clean animation patterns
 * - Error state handling
 * - Accessibility compliance
 */

import { FC } from 'react';
import { motion } from 'framer-motion';
import { useAtomValue } from 'jotai';
import { Loader } from 'lucide-react';
import { purchaseStateAtom } from '../../../../stores/purchase';
import type { TicketReservation } from '../../../../api/types/reservation';

interface ProcessingIndicatorProps {
  reservation: TicketReservation;
}

export const ProcessingIndicator: FC<ProcessingIndicatorProps> = ({ 
  reservation 
}) => {
  const { error } = useAtomValue(purchaseStateAtom);

  return (
    <div className="flex flex-col items-center justify-center py-12 space-y-6">
      {!error ? (
        <>
          {/* Processing Animation */}
          <motion.div
            animate={{ rotate: 360 }}
            transition={{
              duration: 1,
              repeat: Infinity,
              ease: "linear"
            }}
          >
            <Loader className="w-12 h-12 text-indigo-600" />
          </motion.div>

          {/* Status Message */}
          <div className="text-center space-y-2">
            <h3 className="text-lg font-medium text-gray-900">
              Processing Your Purchase
            </h3>
            <p className="text-sm text-gray-500">
              Please wait while we complete your transaction...
            </p>
          </div>

          {/* Transaction Details */}
          <div className="bg-gray-50 rounded-lg px-4 py-3 w-full max-w-sm">
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-gray-500">Amount</dt>
                <dd className="font-medium text-gray-900">
                  ${reservation.total_amount.toFixed(2)}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Tickets</dt>
                <dd className="font-medium text-gray-900">
                  {reservation.ticket_ids.length}
                </dd>
              </div>
            </dl>
          </div>
        </>
      ) : (
        // Error State
        <div className="text-center space-y-4">
          <div className="text-red-600 bg-red-50 p-4 rounded-full inline-flex">
            <svg
              className="w-8 h-8"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-medium text-gray-900">
              Transaction Failed
            </h3>
            <p className="mt-2 text-sm text-gray-500">
              {error.message}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProcessingIndicator;