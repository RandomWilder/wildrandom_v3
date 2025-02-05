/**
 * Balance Check Step Component
 * 
 * Implements the initial purchase flow step for balance verification.
 * Provides user feedback and validation before proceeding with purchase.
 * 
 * Architectural Considerations:
 * - Real-time balance validation
 * - Clear error states
 * - Loading state management
 * - Clean component composition
 */

import { FC, useMemo } from 'react';
import { useAtomValue } from 'jotai';
import { motion, AnimatePresence } from 'framer-motion';
import { DollarSign, AlertTriangle } from 'lucide-react';
import Button from '../../../common/Button';
import { purchaseStateAtom } from '../../../../stores/purchase';
import type { TicketReservation } from '../../../../api/types/reservation';

interface BalanceCheckProps {
  reservation: TicketReservation;
  onProceed: () => void;
}

/**
 * Displays current balance and validates purchase amount
 * Implements real-time validation with proper error feedback
 */
export const BalanceCheck: FC<BalanceCheckProps> = ({
  reservation,
  onProceed
}) => {
  const { balance, error } = useAtomValue(purchaseStateAtom);

  // Compute validation states
  const {
    hasInsufficientBalance,
    formattedBalance,
    formattedRequired
  } = useMemo(() => {
    if (!balance) {
      return {
        hasInsufficientBalance: true,
        formattedBalance: '0.00',
        formattedRequired: reservation.total_amount.toFixed(2)
      };
    }

    return {
      hasInsufficientBalance: balance.available_amount < reservation.total_amount,
      formattedBalance: balance.available_amount.toFixed(2),
      formattedRequired: reservation.total_amount.toFixed(2)
    };
  }, [balance, reservation.total_amount]);

  // Animation variants
  const errorVariants = {
    initial: { opacity: 0, y: -10 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -10 }
  };

  return (
    <div className="space-y-6">
      {/* Balance Display */}
      <div className="bg-gray-50 rounded-lg p-6 space-y-4">
        {/* Available Balance */}
        <div className="flex justify-between items-center">
          <span className="text-gray-600">Available Balance</span>
          <div className="flex items-center space-x-2">
            <DollarSign className="w-5 h-5 text-gray-400" />
            <span className="text-xl font-semibold text-gray-900">
              {formattedBalance}
            </span>
          </div>
        </div>

        {/* Required Amount */}
        <div className="flex justify-between items-center">
          <span className="text-gray-600">Required Amount</span>
          <div className="flex items-center space-x-2">
            <DollarSign className="w-5 h-5 text-gray-400" />
            <span className="text-xl font-semibold text-gray-900">
              {formattedRequired}
            </span>
          </div>
        </div>

        {/* Separator */}
        <div className="border-t border-gray-200" />

        {/* Balance Status */}
        <div className="flex justify-between items-center">
          <span className="text-gray-600">Status</span>
          <span className={`font-medium ${
            hasInsufficientBalance ? 'text-red-600' : 'text-green-600'
          }`}>
            {hasInsufficientBalance ? 'Insufficient Balance' : 'Ready to Purchase'}
          </span>
        </div>
      </div>

      {/* Error Display */}
      <AnimatePresence mode="wait">
        {(error || hasInsufficientBalance) && (
          <motion.div
            variants={errorVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="bg-red-50 text-red-600 px-4 py-3 rounded-lg flex items-start space-x-3"
          >
            <AlertTriangle className="h-5 w-5 flex-shrink-0" />
            <span className="text-sm">
              {error?.message || 'Insufficient balance to complete this purchase. Please add more credits.'}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Action Button */}
      <Button
        variant="primary"
        size="lg"
        fullWidth
        onClick={onProceed}
        disabled={hasInsufficientBalance || !balance}
      >
        Confirm Purchase
      </Button>
    </div>
  );
};

export default BalanceCheck;