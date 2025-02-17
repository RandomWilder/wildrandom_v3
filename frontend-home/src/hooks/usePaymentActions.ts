/**
 * Payment Actions Hook
 * 
 * Implements streamlined purchase flow state management with direct transaction
 * processing and comprehensive error handling. Removes redundant balance checks
 * by leveraging pre-validated reservation state.
 * 
 * @module src/hooks/usePaymentActions
 */

import { useCallback } from 'react';
import { useAtom } from 'jotai';
import { 
  purchaseStateAtom,
  updateTransactionAtom,
  setErrorAtom,
  setStepAtom
} from '../stores/purchase';
import PaymentAPI from '../api/paymentApi';
import { isApiError } from '../api/types/common';
import { 
  PurchaseStep,
  PurchaseErrorCode,
  type UsePaymentActionsResult
} from '../api/types/payment';

/**
 * Hook for managing streamlined payment flow actions and state
 * Implements direct purchase processing with proper error handling
 */
export function usePaymentActions(): UsePaymentActionsResult {
  const [state] = useAtom(purchaseStateAtom);
  const [, updateTransaction] = useAtom(updateTransactionAtom);
  const [, setError] = useAtom(setErrorAtom);
  const [, setStep] = useAtom(setStepAtom);

  /**
   * Process purchase for a pre-validated reservation
   * Handles transaction processing with simplified error mapping
   * 
   * @param reservationId - Valid reservation identifier with pre-validated balance
   */
  const processPurchase = useCallback(async (reservationId: number) => {
    try {
      setStep(PurchaseStep.PROCESSING);

      // Process the purchase directly
      const response = await PaymentAPI.processPurchase(reservationId);
      
      if (isApiError(response)) {
        // Map specific error cases
        if (response.error.code === PurchaseErrorCode.RESERVATION_EXPIRED) {
          setError({
            code: PurchaseErrorCode.RESERVATION_EXPIRED,
            message: 'Reservation has expired'
          });
          return;
        }
        throw new Error(response.error.message);
      }

      if (!response.data) {
        throw new Error('Invalid purchase response');
      }

      // Update transaction state and move to confirmation
      updateTransaction(response.data.transaction);
      setStep(PurchaseStep.CONFIRMATION);

    } catch (err) {
      setError({
        code: PurchaseErrorCode.TRANSACTION_FAILED,
        message: err instanceof Error ? err.message : 'Failed to process purchase'
      });
      setStep(PurchaseStep.ERROR);
    }
  }, [updateTransaction, setError, setStep]);

  /**
   * Reset purchase flow state
   * Implements clean state reset for new purchase attempts
   */
  const resetPurchase = useCallback(() => {
    setStep(PurchaseStep.PROCESSING);
  }, [setStep]);

  return {
    currentStep: state.currentStep,
    isProcessing: state.currentStep === PurchaseStep.PROCESSING,
    error: state.error,
    transaction: state.transaction,
    processPurchase,
    resetPurchase
  };
}

export default usePaymentActions;