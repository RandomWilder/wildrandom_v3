// src/components/features/payment/steps/ReviewStep.tsx

import { FC } from 'react';
import { motion } from 'framer-motion';
import { AlertCircle, DollarSign, Ticket } from 'lucide-react';
import Button from '../../../common/Button';
import type { TicketReservation } from '../../../../api/types/reservation';
import type { SiteCreditBalance } from '../../../../api/types/payment';

/**
 * Props interface for ReviewStep component
 * Defines required data for transaction review and user interaction
 */
interface ReviewStepProps {
  reservation: TicketReservation;
  balance: SiteCreditBalance;
  onConfirm: () => void;
  onCancel: () => void;
  isProcessing?: boolean;
}

/**
 * ReviewStep Component
 * Implements the initial review phase of the purchase flow.
 * Displays transaction details and handles user confirmation.
 */
export const ReviewStep: FC<ReviewStepProps> = ({
  reservation,
  balance,
  onConfirm,
  onCancel,
  isProcessing = false
}) => {
  // Compute transaction feasibility based on available balance
  const canProceed = balance.available_balance >= reservation.total_amount;
  const remainingBalance = balance.available_balance - reservation.total_amount;

  return (
    <div className="space-y-6">
      {/* Transaction Summary Section */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Purchase Summary
          </h3>
          
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-2 text-gray-600">
                <Ticket className="w-5 h-5" />
                <span>Tickets Selected</span>
              </div>
              <span className="font-medium text-gray-900">
                {reservation.ticket_ids.length}
              </span>
            </div>

            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-2 text-gray-600">
                <DollarSign className="w-5 h-5" />
                <span>Total Amount</span>
              </div>
              <span className="font-medium text-gray-900">
                ${reservation.total_amount.toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Balance Information Section */}
      <div className="bg-gray-50 rounded-lg p-4">
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Available Balance</span>
            <span className="font-medium text-gray-900">
              ${balance.available_balance.toFixed(2)}
            </span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-gray-600">Balance After Purchase</span>
            <span className={`font-medium ${
              remainingBalance >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              ${remainingBalance.toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      {/* Validation Message */}
      {!canProceed && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center space-x-2 text-red-600 bg-red-50 p-3 rounded-lg"
        >
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span className="text-sm">
            Insufficient balance for this purchase. Please add more credits.
          </span>
        </motion.div>
      )}

      {/* Action Buttons */}
      <div className="space-y-3">
        <Button
          variant="primary"
          fullWidth
          size="lg"
          onClick={onConfirm}
          disabled={!canProceed || isProcessing}
        >
          Confirm Purchase
        </Button>

        <Button
          variant="secondary"
          fullWidth
          size="lg"
          onClick={onCancel}
          disabled={isProcessing}
        >
          Cancel
        </Button>
      </div>
    </div>
  );
};

export default ReviewStep;