// src/features/payment/types.ts

/**
 * Payment Flow Type Definitions
 * 
 * Implements a user-controlled purchase flow with explicit state progression
 * and comprehensive type safety. Ensures proper user confirmation before
 * any financial transaction processing.
 */

import type { TicketReservation } from '../../api/types/reservation';
import { 
  PurchaseStatus,
  type PurchaseTransaction as APIPurchaseTransaction 
} from '../../api/types/payment';

export { PurchaseStatus };

/**
 * Purchase flow steps with explicit user control points
 * 
 * REVIEW     - Initial state, shows transaction details and requires user confirmation
 * PROCESSING - Active transaction processing after user confirmation
 * CONFIRMATION - Successful completion state
 * ERROR     - Terminal error state
 */
export enum PurchaseStep {
  REVIEW = 'REVIEW',
  PROCESSING = 'PROCESSING',
  CONFIRMATION = 'CONFIRMATION',
  ERROR = 'ERROR'
}

/**
 * Core purchase state tracking
 */
export interface PurchaseState {
  currentStep: PurchaseStep;
  transaction: APIPurchaseTransaction | null;
  error: PurchaseError | null;
  isProcessing: boolean;
}

/**
 * Granular error classification for proper error handling
 */
export enum PurchaseErrorCode {
  INSUFFICIENT_BALANCE = 'INSUFFICIENT_BALANCE',
  RESERVATION_EXPIRED = 'RESERVATION_EXPIRED',
  TRANSACTION_FAILED = 'TRANSACTION_FAILED',
  NETWORK_ERROR = 'NETWORK_ERROR'
}

export interface PurchaseError {
  code: PurchaseErrorCode;
  message: string;
  details?: Record<string, unknown>;
}

export interface SiteCreditBalance {
  user_id: number;
  available_amount: number;
  pending_amount: number;
  last_updated: string;
}

/**
 * Complete state interface for purchase flow
 * Tracks the entire lifecycle of a purchase transaction
 */
export interface PurchaseFlowState {
  currentStep: PurchaseStep;
  reservation: TicketReservation | null;
  balance: SiteCreditBalance | null;
  transaction: APIPurchaseTransaction | null;
  error: PurchaseError | null;
  isProcessing: boolean;
  canProceed?: boolean;  // New field to control user progression
}

// Re-export the API transaction type to maintain consistency
export type PurchaseTransaction = APIPurchaseTransaction;

/**
 * Enhanced hook result type with user-controlled flow management
 */
export interface UsePaymentActionsResult {
  currentStep: PurchaseStep;
  isProcessing: boolean;
  error: PurchaseError | null;
  transaction: PurchaseTransaction | null;
  canProceed: boolean;  // Added to control button availability
  initiatePurchase: (reservationId: number) => Promise<void>;
  processPurchase: (reservationId: number) => Promise<void>;
  resetPurchase: () => void;
}

/**
 * Type guard for purchase errors
 */
export function isPurchaseError(error: unknown): error is PurchaseError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    'message' in error &&
    Object.values(PurchaseErrorCode).includes((error as PurchaseError).code)
  );
}