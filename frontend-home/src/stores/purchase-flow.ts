import { atom, useAtom } from 'jotai';
import { atomWithReset } from 'jotai/utils';
import { 
  PurchaseFlowStep,
  PaymentMethod,
  type PurchaseFlowState,
  type PurchaseFlowAction
} from '../types/purchase-flow';

/**
 * Initial purchase flow state
 */
const initialState: PurchaseFlowState = {
  step: PurchaseFlowStep.IDLE,
  reservation: null,
  balance: null,
  transaction: null,
  error: null,
  selectedPaymentMethod: null
};

/**
 * Primary purchase flow atom
 * Implements resettable state for clean flow management
 */
export const purchaseFlowAtom = atomWithReset<PurchaseFlowState>(initialState);

/**
 * Computed atoms for derived state
 */
export const canProceedAtom = atom((get) => {
  const state = get(purchaseFlowAtom);
  if (!state.reservation || !state.balance) return false;
  
  const sufficientBalance = state.balance.available_balance >= state.reservation.total_amount;
  return state.selectedPaymentMethod === PaymentMethod.SITE_CREDIT ? sufficientBalance : true;
});

/**
 * Action atom for state mutations
 */
export const purchaseFlowActionsAtom = atom(
  null,
  (get, set, action: PurchaseFlowAction) => {
    const currentState = get(purchaseFlowAtom);

    switch (action.type) {
      case 'SET_STEP':
        set(purchaseFlowAtom, {
          ...currentState,
          step: action.payload,
          error: null
        });
        break;

      case 'SET_RESERVATION':
        set(purchaseFlowAtom, {
          ...currentState,
          reservation: action.payload,
          error: null
        });
        break;

      case 'SET_BALANCE':
        set(purchaseFlowAtom, {
          ...currentState,
          balance: action.payload,
          error: null
        });
        break;

      case 'SET_TRANSACTION':
        set(purchaseFlowAtom, {
          ...currentState,
          transaction: action.payload,
          step: PurchaseFlowStep.CONFIRMATION,
          error: null
        });
        break;

      case 'SET_ERROR':
        set(purchaseFlowAtom, {
          ...currentState,
          error: action.payload,
          step: PurchaseFlowStep.ERROR
        });
        break;

      case 'SET_PAYMENT_METHOD':
        set(purchaseFlowAtom, {
          ...currentState,
          selectedPaymentMethod: action.payload,
          error: null
        });
        break;

      case 'RESET':
        set(purchaseFlowAtom, initialState);
        break;
    }
  }
);

/**
 * Custom hook for purchase flow state management
 */
export function usePurchaseFlow() {
  const [state] = useAtom(purchaseFlowAtom);
  const [, dispatch] = useAtom(purchaseFlowActionsAtom);
  const [canProceed] = useAtom(canProceedAtom);

  return {
    state,
    dispatch,
    canProceed
  };
}