/**
 * Completion Screen Component
 * 
 * Implements the final step of the purchase flow with transaction
 * summary and confirmation. Provides clear success feedback and
 * next steps for the user.
 * 
 * Architectural Considerations:
 * - Clean transaction summary
 * - Proper success animations
 * - TypeScript integration
 * - Accessibility patterns
 */

import { FC, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAtomValue } from 'jotai';
import { CheckCircle } from 'lucide-react';
import { purchaseStateAtom } from '../../../../stores/purchase';
import Button from '../../../common/Button';
import type { TicketReservation } from '../../../../api/types/reservation';

interface CompletionScreenProps {
  reservation: TicketReservation;
  onClose: (transactionId: number) => void;
}

export const CompletionScreen: FC<CompletionScreenProps> = ({
  reservation,
  onClose
}) => {
  const { transaction, balance } = useAtomValue(purchaseStateAtom);

  // Auto-close on successful completion
  useEffect(() => {
    if (transaction?.id) {
      const timer = setTimeout(() => {
        onClose(transaction.id);
      }, 5000); // Auto-close after 5 seconds

      return () => clearTimeout(timer);
    }
  }, [transaction?.id, onClose]);

  // Early return if no transaction
  if (!transaction) return null;

  return (
    <div className="flex flex-col items-center text-center py-6 space-y-6">
      {/* Success Animation */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{
          type: "spring",
          stiffness: 200,
          damping: 20
        }}
        className="rounded-full bg-green-100 p-3"
      >
        <CheckCircle className="w-12 h-12 text-green-600" />
      </motion.div>

      {/* Success Message */}
      <div className="space-y-2">
        <h3 className="text-xl font-semibold text-gray-900">
          Purchase Complete!
        </h3>
        <p className="text-sm text-gray-500">
          Your tickets have been secured successfully
        </p>
      </div>

      {/* Transaction Summary */}
      <div className="w-full max-w-sm bg-gray-50 rounded-lg p-6 space-y-4">
        <dl className="space-y-3">
          <div className="flex justify-between">
            <dt className="text-gray-500">Transaction ID</dt>
            <dd className="font-mono text-gray-900">
              #{transaction.id}
            </dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-gray-500">Amount Paid</dt>
            <dd className="font-medium text-gray-900">
              ${reservation.total_amount.toFixed(2)}
            </dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-gray-500">Tickets Purchased</dt>
            <dd className="font-medium text-gray-900">
              {reservation.ticket_ids.length}
            </dd>
          </div>
          {balance && (
            <div className="flex justify-between border-t border-gray-200 pt-3">
              <dt className="text-gray-500">Remaining Balance</dt>
              <dd className="font-medium text-gray-900">
                ${balance.available_amount.toFixed(2)}
              </dd>
            </div>
          )}
        </dl>
      </div>

      {/* Action Button */}
      <Button
        variant="primary"
        size="lg"
        fullWidth
        onClick={() => transaction.id && onClose(transaction.id)}
      >
        View My Tickets
      </Button>

      {/* Auto-close Notice */}
      <p className="text-sm text-gray-500">
        This window will close automatically in a few seconds
      </p>
    </div>
  );
};

export default CompletionScreen;