/**
 * Purchase Flow State Management
 * 
 * Implements atomic state management for the purchase flow using Jotai.
 * Provides type-safe state transitions and computed states while maintaining
 * proper integration with the payment service.
 */

import { atom } from 'jotai';
import { atomWithReset } from 'jotai/utils';
import { PurchaseStep } from '../api/types/payment';
import type { 
  PurchaseFlowState,
  PurchaseError,
  SiteCreditBalance,
  PurchaseTransaction 
} from '../api/types/payment';
import type { ReservationStatus } from '../api/types/reservation';

/**
 * Initial purchase flow state
 * Establishes proper null safety for all optional values
 */
const initialState: PurchaseFlowState = {
  currentStep: PurchaseStep.BALANCE_CHECK,
  reservationId: null,
  reservationStatus: null,
  balance: null,
  transaction: null,
  error: null,
  isProcessing: false
};

/**
 * Primary purchase state atom
 * Uses atomWithReset for proper state reset capabilities
 */
export const purchaseStateAtom = atomWithReset<PurchaseFlowState>(initialState);

/**
 * Computed atoms for derived state
 */
export const isActivePurchaseAtom = atom((get) => {
  const state = get(purchaseStateAtom);
  return state.currentStep !== PurchaseStep.ERROR && state.reservationId !== null;
});

export const isPurchaseCompletedAtom = atom((get) => {
  const state = get(purchaseStateAtom);
  return state.currentStep === PurchaseStep.CONFIRMATION && 
         state.transaction?.status === 'completed';
});

export const purchaseErrorAtom = atom((get) => get(purchaseStateAtom).error);

export const canProceedAtom = atom((get) => {
  const state = get(purchaseStateAtom);
  if (!state.balance || !state.reservationId) return false;
  return state.balance.available_amount >= (state.transaction?.amount || 0);
});

/**
 * Type-safe state update helpers
 */
export const updateBalanceAtom = atom(
  null,
  (_, set, balance: SiteCreditBalance) => {
    set(purchaseStateAtom, (prev) => ({
      ...prev,
      balance,
      error: null
    }));
  }
);

export const updateTransactionAtom = atom(
  null,
  (_, set, transaction: PurchaseTransaction) => {
    set(purchaseStateAtom, (prev) => ({
      ...prev,
      transaction,
      error: null
    }));
  }
);

export const setErrorAtom = atom(
  null,
  (_, set, error: PurchaseError) => {
    set(purchaseStateAtom, (prev) => ({
      ...prev,
      error,
      currentStep: PurchaseStep.ERROR,
      isProcessing: false
    }));
  }
);

export const setStepAtom = atom(
  null,
  (_, set, step: PurchaseStep) => {
    set(purchaseStateAtom, (prev) => ({
      ...prev,
      currentStep: step,
      isProcessing: step === PurchaseStep.PROCESSING,
      error: null
    }));
  }
);

export const updateReservationStatusAtom = atom(
  null,
  (_, set, status: ReservationStatus) => {
    set(purchaseStateAtom, (prev) => ({
      ...prev,
      reservationStatus: status,
      error: null
    }));
  }
);

/**
 * Type guard for purchase state validation
 */
export const isPurchaseState = (state: unknown): state is PurchaseFlowState => {
  return (
    typeof state === 'object' &&
    state !== null &&
    'currentStep' in state &&
    'isProcessing' in state
  );
};