/**
 * Purchase Modal Component
 * 
 * Implements the ticket purchase flow UI with proper state management
 * and error handling. Follows established modal patterns while maintaining
 * strict type safety and proper backend integration.
 */

import React, { FC, useEffect, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import Button from '../../common/Button';
import { FeatureErrorBoundary } from '../../common/ErrorBoundary';
import { usePaymentActions } from '../../../hooks/usePaymentActions';
import { useAtomValue } from 'jotai';
import { purchaseStateAtom } from '../../../stores/purchase';
import { PurchaseStep } from '../../../api/types/payment';
import type { TicketReservation } from '../../../api/types/reservation';

// Lazy load step components with proper path resolution
const BalanceCheck = React.lazy(() => import('../payment/steps/BalanceCheck'));
const ProcessingIndicator = React.lazy(() => import('../payment/steps/ProcessingIndicator'));
const CompletionScreen = React.lazy(() => import('../payment/steps/CompletionScreen'));

interface PurchaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  reservation: TicketReservation;
  onComplete: (transactionId: number) => void;
}

/**
 * Modal component for handling the purchase flow with proper state transitions
 */
export const PurchaseModal: FC<PurchaseModalProps> = ({
  isOpen,
  onClose,
  reservation,
  onComplete
}) => {
  const {
    isProcessing,
    initiatePurchase,
    processPurchase,
    resetPurchase
  } = usePaymentActions();

  // Subscribe to purchase state for step tracking
  const { currentStep } = useAtomValue(purchaseStateAtom);

  // Initialize purchase flow
  useEffect(() => {
    if (isOpen && reservation) {
      initiatePurchase(reservation.id);
    }
    return () => {
      if (!isOpen) {
        resetPurchase();
      }
    };
  }, [isOpen, reservation, initiatePurchase, resetPurchase]);

  // Handle modal close with proper cleanup
  const handleClose = () => {
    if (!isProcessing) {
      resetPurchase();
      onClose();
    }
  };

  // Step transition handlers
  const handleProceedToPayment = () => {
    processPurchase(reservation.id);
  };

  const handleTransactionComplete = (transactionId: number) => {
    onComplete(transactionId);
    handleClose();
  };

  // Loading fallback component
  const LoadingSpinner: FC = () => (
    <div className="flex items-center justify-center h-48">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
    </div>
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Modal Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={isProcessing ? undefined : handleClose}
            className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40"
          />

          {/* Modal Content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed inset-x-4 bottom-4 md:inset-auto md:top-[10%] md:left-1/2 md:-translate-x-1/2 md:max-w-lg md:w-full z-50"
          >
            <div className="bg-white rounded-xl shadow-xl overflow-hidden">
              {/* Modal Header */}
              <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">
                  Complete Purchase
                </h2>
                {!isProcessing && (
                  <button
                    onClick={handleClose}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                    aria-label="Close modal"
                  >
                    <X className="w-5 h-5 text-gray-500" />
                  </button>
                )}
              </div>

              {/* Modal Content with Error Boundary */}
              <FeatureErrorBoundary feature="Purchase Flow">
                <div className="p-6">
                  <Suspense fallback={<LoadingSpinner />}>
                    {currentStep === PurchaseStep.BALANCE_CHECK && (
                      <BalanceCheck
                        reservation={reservation}
                        onProceed={handleProceedToPayment}
                      />
                    )}

                    {currentStep === PurchaseStep.PROCESSING && (
                      <ProcessingIndicator 
                        reservation={reservation}
                      />
                    )}

                    {currentStep === PurchaseStep.CONFIRMATION && (
                      <CompletionScreen
                        reservation={reservation}
                        onClose={handleTransactionComplete}
                      />
                    )}
                  </Suspense>
                </div>
              </FeatureErrorBoundary>

              {/* Modal Footer */}
              {!isProcessing && (
                <div className="px-6 py-4 bg-gray-50 border-t border-gray-100">
                  <Button
                    variant={currentStep === PurchaseStep.CONFIRMATION ? "primary" : "secondary"}
                    fullWidth
                    size="lg"
                    onClick={handleClose}
                    disabled={isProcessing}
                  >
                    {currentStep === PurchaseStep.CONFIRMATION ? 'View Tickets' : 'Cancel'}
                  </Button>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default PurchaseModal;