/**
 * Purchase Flow Step Enumeration
 * Defines discrete states in the purchase lifecycle
 */
export enum PurchaseFlowStep {
    IDLE = 'IDLE',
    RESERVATION = 'RESERVATION',
    REVIEW = 'REVIEW',
    PROCESSING = 'PROCESSING',
    CONFIRMATION = 'CONFIRMATION',
    ERROR = 'ERROR'
  }
  
  /**
   * Payment Method Types
   * Supported payment methods for ticket purchases
   */
  export enum PaymentMethod {
    SITE_CREDIT = 'SITE_CREDIT',
    EXTERNAL = 'EXTERNAL'
  }
  
  // Import types from API definitions
  import type { TicketReservation } from '../api/types/reservation';
  import type { 
    SiteCreditBalance, 
    PurchaseTransaction 
  } from '../api/types/payment';
  
  /**
   * Purchase Flow State Interface
   * Complete state shape for managing the purchase lifecycle
   */
  export interface PurchaseFlowState {
    step: PurchaseFlowStep;
    reservation: TicketReservation | null;
    balance: SiteCreditBalance | null;
    transaction: PurchaseTransaction | null;
    error: string | null;
    selectedPaymentMethod: PaymentMethod | null;
  }
  
  /**
   * Purchase Flow Action Types
   * Comprehensive set of actions for state mutations
   */
  export type PurchaseFlowAction =
    | { type: 'SET_STEP'; payload: PurchaseFlowStep }
    | { type: 'SET_RESERVATION'; payload: TicketReservation }
    | { type: 'SET_BALANCE'; payload: SiteCreditBalance }
    | { type: 'SET_TRANSACTION'; payload: PurchaseTransaction }
    | { type: 'SET_ERROR'; payload: string }
    | { type: 'SET_PAYMENT_METHOD'; payload: PaymentMethod }
    | { type: 'RESET' };

    export const isPurchaseFlowStateValid = (state: PurchaseFlowState): boolean => {
        return (
          state.reservation !== null &&
          state.balance !== null &&
          typeof state.balance.available_balance === 'number' &&
          typeof state.reservation.total_amount === 'number'
        );
      };
      