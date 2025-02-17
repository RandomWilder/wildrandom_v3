// src/components/features/payment/steps/BalanceCheck.tsx

import { FC, useMemo } from 'react';
import { motion } from 'framer-motion';
import { DollarSign, AlertTriangle } from 'lucide-react';
import Button from '../../../common/Button';
import { useBalanceValidation } from '../../../../hooks/useBalanceValidation';
import type { TicketReservation } from '../../../../api/types/reservation';

interface BalanceCheckProps {
  reservation: TicketReservation;
  onProceed: () => Promise<void>;
}

/**
 * BalanceCheck Component
 * 
 * Validates user balance against reservation amount with real-time updates
 * and optimistic UI patterns. Implements proper error handling and loading states.
 * 
 * @component
 */
export const BalanceCheck: FC<BalanceCheckProps> = ({
  reservation,
  onProceed
}) => {
  const { balance, isLoading, error: balanceError } = useBalanceValidation();

  // Computed balance state with proper type safety
  const {
    hasInsufficientBalance,
    formattedBalance,
    formattedRequired,
    balanceAfterPurchase
  } = useMemo(() => {
    if (!balance) {
      return {
        hasInsufficientBalance: true,
        formattedBalance: '0.00',
        formattedRequired: reservation.total_amount.toFixed(2),
        balanceAfterPurchase: 0
      };
    }

    const afterPurchase = balance.available_amount - reservation.total_amount;
    return {
      hasInsufficientBalance: afterPurchase < 0,
      formattedBalance: balance.available_amount.toFixed(2),
      formattedRequired: reservation.total_amount.toFixed(2),
      balanceAfterPurchase: Math.max(0, afterPurchase)
    };
  }, [balance, reservation.total_amount]);

  return (
    <div className="space-y-6">
      {/* Balance Summary */}
      <div className="bg-gray-50 rounded-lg p-6 space-y-4">
        {/* Available Balance */}
        <div className="flex justify-between items-center">
          <span className="text-gray-600">Available Balance</span>
          <div className="flex items-center space-x-2">
            <DollarSign className="w-5 h-5 text-gray-400" />
            <span className={`text-xl font-semibold ${
              isLoading ? 'text-gray-400' : 'text-gray-900'
            }`}>
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

        {/* Balance After Purchase */}
        <div className="flex justify-between items-center">
          <span className="text-gray-600">Balance After Purchase</span>
          <div className="flex items-center space-x-2">
            <DollarSign className="w-5 h-5 text-gray-400" />
            <span className={`text-xl font-semibold ${
              hasInsufficientBalance ? 'text-red-600' : 'text-green-600'
            }`}>
              {balanceAfterPurchase.toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {(balanceError || hasInsufficientBalance) && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-50 text-red-600 px-4 py-3 rounded-lg flex items-start space-x-3"
        >
          <AlertTriangle className="h-5 w-5 flex-shrink-0" />
          <span className="text-sm">
            {balanceError || 
              (hasInsufficientBalance 
                ? 'Insufficient balance for this purchase. Please add more credits.'
                : 'Unable to verify balance.')}
          </span>
        </motion.div>
      )}

      {/* Action Buttons */}
      <div className="space-y-3">
        <Button
          variant="primary"
          size="lg"
          fullWidth
          onClick={onProceed}
          disabled={isLoading || hasInsufficientBalance}
          isLoading={isLoading}
        >
          Complete Purchase
        </Button>

        {hasInsufficientBalance && (
          <Button
            variant="secondary"
            size="lg"
            fullWidth
            onClick={() => {/* Will be implemented in Phase 2 */}}
          >
            Add Credits
          </Button>
        )}
      </div>
    </div>
  );
};

export default BalanceCheck;