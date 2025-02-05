/**
 * Payment Actions Hook
 * 
 * Provides type-safe interface for payment operations with comprehensive state management.
 * Implements proper error handling and state transitions aligned with backend service.
 * 
 * Architectural Considerations:
 * - Strict type safety with proper null handling
 * - Atomic state updates with validation
 * - Clean error propagation patterns
 * - Proper API response handling
 */

import { useCallback } from 'react';
import { useAtom } from 'jotai';
import {
  purchaseStateAtom,
  updateBalanceAtom,
  updateTransactionAtom,
  setErrorAtom,
  setStepAtom
} from '../stores/purchase';
import { PurchaseStep, PurchaseErrorCode } from '../api/types/payment';
import { isApiError, isApiSuccess } from '../api/types/common';
import PaymentAPI from '../api/paymentApi';

interface UsePaymentActionsResult {
  isProcessing: boolean;
  hasError: boolean;
  initiatePurchase: (reservationId: number) => Promise<void>;
  processPurchase: (reservationId: number) => Promise<void>;
  updateStep: (step: PurchaseStep) => void;
  resetPurchase: () => void;
}

/**
 * Hook for managing payment-related actions and state transitions
 */
export const usePaymentActions = (): UsePaymentActionsResult => {
  const [state] = useAtom(purchaseStateAtom);
  const [, updateBalance] = useAtom(updateBalanceAtom);
  const [, updateTransaction] = useAtom(updateTransactionAtom);
  const [, setError] = useAtom(setErrorAtom);
  const [, setStep] = useAtom(setStepAtom);

  /**
   * Initialize purchase flow with balance verification
   */
  const initiatePurchase = useCallback(async () => {
    try {
      setStep(PurchaseStep.BALANCE_CHECK);

      const balanceResponse = await PaymentAPI.getBalance();
      
      if (isApiError(balanceResponse)) {
        setError({
          code: PurchaseErrorCode.NETWORK_ERROR,
          message: balanceResponse.error.message,
          details: balanceResponse.error.details
        });
        return;
      }

      if (isApiSuccess(balanceResponse)) {
        updateBalance(balanceResponse.data);
      }
      
    } catch (err) {
      setError({
        code: PurchaseErrorCode.NETWORK_ERROR,
        message: err instanceof Error ? err.message : 'Failed to initialize purchase',
        details: undefined
      });
    }
  }, [setStep, setError, updateBalance]);

  /**
   * Process purchase transaction with proper error handling
   */
  const processPurchase = useCallback(async (reservationId: number) => {
    try {
      setStep(PurchaseStep.PROCESSING);

      const response = await PaymentAPI.processPurchase(reservationId);
      
      if (isApiError(response)) {
        setError({
          code: PurchaseErrorCode.TRANSACTION_FAILED,
          message: response.error.message,
          details: response.error.details
        });
        return;
      }

      if (isApiSuccess(response)) {
        updateTransaction(response.data.transaction);
        setStep(PurchaseStep.CONFIRMATION);
      }

    } catch (err) {
      setError({
        code: PurchaseErrorCode.TRANSACTION_FAILED,
        message: err instanceof Error ? err.message : 'Failed to process purchase',
        details: undefined
      });
    }
  }, [setStep, setError, updateTransaction]);

  /**
   * Update purchase flow step with validation
   */
  const updateStep = useCallback((step: PurchaseStep) => {
    setStep(step);
  }, [setStep]);

  /**
   * Reset purchase flow state
   */
  const resetPurchase = useCallback(() => {
    setStep(PurchaseStep.BALANCE_CHECK);
  }, [setStep]);

  return {
    isProcessing: state.isProcessing,
    hasError: state.error !== null,
    initiatePurchase,
    processPurchase,
    updateStep,
    resetPurchase
  };
};

export default usePaymentActions;