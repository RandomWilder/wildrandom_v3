// src/components/features/payment/steps/CompletionScreen.tsx

import { FC, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle } from 'lucide-react';
import { useAtomValue } from 'jotai';
import { sessionAtom } from '../../../../stores/session';
import Button from '../../../common/Button';
import type { TicketReservation } from '../../../../api/types/reservation';
import type { PurchaseTransaction } from '../../../../features/payment/types';

interface CompletionScreenProps {
  reservation: TicketReservation;
  transaction: PurchaseTransaction | null;
  onClose: () => void;
}

export const CompletionScreen: FC<CompletionScreenProps> = ({
  reservation,
  transaction,
  onClose
}) => {
  const session = useAtomValue(sessionAtom);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (transaction?.id) {
        onClose();
      }
    }, 5000);

    return () => clearTimeout(timer);
  }, [transaction?.id, onClose]);

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

      {/* Purchase Details */}
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
              ${transaction.amount.toFixed(2)}
            </dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-gray-500">Tickets Purchased</dt>
            <dd className="font-medium text-gray-900">
              {transaction.meta_data?.ticket_ids?.length ?? 0}
            </dd>
          </div>
          {session.balance && (
            <div className="flex justify-between border-t border-gray-200 pt-3">
              <dt className="text-gray-500">Remaining Balance</dt>
              <dd className="font-medium text-gray-900">
                ${session.balance.available_amount.toFixed(2)}
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
        onClick={onClose}
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