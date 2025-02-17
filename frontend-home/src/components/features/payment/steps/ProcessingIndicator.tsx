// src/components/features/payment/steps/ProcessingIndicator.tsx

import { FC } from 'react';
import { motion } from 'framer-motion';
import { Loader, DollarSign } from 'lucide-react';
import type { TicketReservation } from '../../../../api/types/reservation';

interface ProcessingIndicatorProps {
  reservation: TicketReservation;
}

export const ProcessingIndicator: FC<ProcessingIndicatorProps> = ({ 
  reservation 
}) => {
  // Safe access helpers
  const ticketCount = reservation?.ticket_ids?.length ?? 0;
  const amount = reservation?.total_amount ?? 0;
  const reservationId = reservation?.id;

  return (
    <div className="flex flex-col items-center justify-center py-12 space-y-6">
      {/* Processing Animation */}
      <motion.div
        animate={{ rotate: 360 }}
        transition={{
          duration: 1,
          repeat: Infinity,
          ease: "linear"
        }}
        className="relative"
      >
        <Loader className="w-12 h-12 text-indigo-600" />
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="absolute inset-0 flex items-center justify-center"
        >
          <DollarSign className="w-6 h-6 text-indigo-600" />
        </motion.div>
      </motion.div>

      {/* Status Message */}
      <div className="text-center space-y-2">
        <h3 className="text-lg font-medium text-gray-900">
          Processing Your Purchase
        </h3>
        <p className="text-sm text-gray-500">
          Please wait while we secure your tickets...
        </p>
      </div>

      {/* Transaction Details */}
      {reservation && (
        <div className="bg-gray-50 rounded-lg px-4 py-3 w-full max-w-sm">
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-gray-500">Amount</dt>
              <dd className="font-medium text-gray-900">
                ${amount.toFixed(2)}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">Tickets</dt>
              <dd className="font-medium text-gray-900">
                {ticketCount}
              </dd>
            </div>
            {reservationId && (
              <div className="flex justify-between pt-2 border-t border-gray-200">
                <dt className="text-gray-500">Reservation ID</dt>
                <dd className="font-mono text-gray-900">
                  #{reservationId}
                </dd>
              </div>
            )}
          </dl>
        </div>
      )}

      {/* Processing Steps */}
      <div className="w-full max-w-sm space-y-2">
        <ProcessingStep
          step="Verifying reservation"
          status="complete"
        />
        <ProcessingStep
          step="Processing payment"
          status="active"
        />
        <ProcessingStep
          step="Confirming tickets"
          status="pending"
        />
      </div>
    </div>
  );
};

// Processing step subcomponent
interface ProcessingStepProps {
  step: string;
  status: 'pending' | 'active' | 'complete';
}

const ProcessingStep: FC<ProcessingStepProps> = ({ step, status }) => {
  const getStatusStyles = () => {
    switch (status) {
      case 'complete':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'active':
        return 'bg-indigo-100 text-indigo-700 border-indigo-200 animate-pulse';
      default:
        return 'bg-gray-100 text-gray-500 border-gray-200';
    }
  };

  return (
    <div className={`px-3 py-2 rounded-lg border ${getStatusStyles()}`}>
      <span className="text-sm font-medium">{step}</span>
    </div>
  );
};

export default ProcessingIndicator;