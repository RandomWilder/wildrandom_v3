import { FC, useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, Loader } from 'lucide-react';
import Card from '../../common/Card';
import Button from '../../common/Button';
import { usePurchaseFlow } from '../../../stores/purchase-flow';
import PaymentAPI from '../../../api/paymentApi';
import { useAtom } from 'jotai';
import { sessionAtom } from '../../../stores/session';
import type { SiteCreditBalance } from '../../../api/types/payment';

interface PurchaseModalProps {
  isOpen: boolean;
  onComplete: (transactionId: number) => void;
  onError: (error: string) => void;
}

/**
 * PurchaseModal Component
 * 
 * Handles transaction processing with proper state management and race condition prevention.
 * Implements atomic balance updates and ensures single request processing.
 */
const PurchaseModal: FC<PurchaseModalProps> = ({
  isOpen,
  onComplete,
  onError
}) => {
  const { state } = usePurchaseFlow();
  const { reservation, selectedPaymentMethod } = state;
  const [isProcessing, setIsProcessing] = useState(false);
  const processingRef = useRef(false);
  const [, setSession] = useAtom(sessionAtom); // Removed unused session variable

  useEffect(() => {
    if (!isOpen || !reservation || !selectedPaymentMethod || processingRef.current) return;

    const processTransaction = async () => {
      if (processingRef.current) return;
      processingRef.current = true;

      try {
        setIsProcessing(true);
        const response = await PaymentAPI.processPurchase(reservation.id);

        if (response.error) {
          throw new Error(response.error.message);
        }

        if (!response.data?.transaction?.id) {
          throw new Error('Invalid transaction response');
        }

        // Update session balance immediately after successful purchase
        if (response.data && 'new_balance' in response.data) {
          const newBalance: SiteCreditBalance = {
            user_id: reservation.user_id, // Ensure this matches the expected type
            available_balance: response.data.new_balance,
            pending_balance: 0, // Default value as per type requirements
            last_updated: new Date().toISOString()
          };

          setSession(prev => ({
            ...prev,
            balance: newBalance,
            balanceLastUpdated: new Date().toISOString()
          }));
        }

        onComplete(response.data.transaction.id);
      } catch (err) {
        onError(err instanceof Error ? err.message : 'Transaction failed');
      } finally {
        setIsProcessing(false);
        processingRef.current = false;
      }
    };

    processTransaction();
  }, [isOpen, reservation, selectedPaymentMethod, onComplete, onError, setSession]);

  if (!isOpen || !reservation) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" />
      
      <Card variant="default" className="relative z-50 w-full max-w-lg mx-4">
        <div className="p-6">
          <div className="flex flex-col items-center text-center space-y-4">
            {isProcessing ? (
              <>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                >
                  <Loader className="w-12 h-12 text-indigo-600" />
                </motion.div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Processing Your Purchase
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Please wait while we secure your tickets...
                  </p>
                </div>
              </>
            ) : (
              <>
                <AlertTriangle className="w-12 h-12 text-amber-500" />
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Processing Error
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    An error occurred while processing your purchase.
                    Please try again or contact support.
                  </p>
                </div>
                <Button
                  variant="primary"
                  onClick={() => {
                    processingRef.current = false;
                    setIsProcessing(true);
                  }}
                >
                  Retry Purchase
                </Button>
              </>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
};

export default PurchaseModal;