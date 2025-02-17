/**
 * Payment Service Type Definitions
 * 
 * Implements the domain model and response types for the payment service.
 * Aligns with backend payment_service models and schemas while maintaining
 * frontend type safety and proper error discrimination.
 * 
 * @see backend: src/payment_service/models/
 */

import type { ApiResponse } from './common';
import type { ReservationStatus, TicketReservation } from './reservation';

// #region Domain Models

/**
 * User balance information aligned with Balance model
 * @see backend: src/payment_service/models/balance.py
 */
export interface SiteCreditBalance {
  user_id: number;
  available_balance: number;
  pending_balance: number;
  last_updated: string;
}

/**
 * Transaction status enumeration matching backend states
 * @see backend: src/payment_service/models/transaction.py
 */
export enum PurchaseStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  ROLLED_BACK = 'rolled_back'
}

/**
 * Transaction type enumeration for reference tracking
 * @see backend: src/payment_service/models/transaction.py
 */
export enum ReferenceType {
  TICKET_PURCHASE = 'ticket_purchase',
  PRIZE_CLAIM = 'prize_claim',
  REFUND = 'refund',
  ADJUSTMENT = 'adjustment'
}

/**
 * Transaction model aligned with backend Transaction
 * @see backend: src/payment_service/models/transaction.py
 */
export interface PurchaseTransaction {
  id: number;
  user_id: number;
  type: 'debit' | 'credit';
  amount: number;
  balance_after: number | null;
  status: PurchaseStatus;
  reference_type: ReferenceType;
  reference_id: string;
  meta_data: {
    notes?: string;
    reservation_id?: number;
    ticket_ids?: string[];
    failure_reason?: string;
    rollback_reason?: string;
  };
  created_at: string;
  completed_at: string | null;
  credit_transaction_id: number | null;
}

// #region Error Handling

/**
 * Purchase error codes aligned with backend error classification
 */
export enum PurchaseErrorCode {
  INSUFFICIENT_BALANCE = 'INSUFFICIENT_BALANCE',
  RESERVATION_EXPIRED = 'RESERVATION_EXPIRED',
  TRANSACTION_FAILED = 'TRANSACTION_FAILED',
  NETWORK_ERROR = 'NETWORK_ERROR'
}

/**
 * Purchase error structure with proper typing
 */
export interface PurchaseError {
  code: PurchaseErrorCode;
  message: string;
  details?: Record<string, unknown>;
}

// #region API Contracts

/**
 * Purchase request payload type
 * @see backend: src/payment_service/schemas/transaction_schema.py
 */
export interface PurchaseRequest {
  reservation_id: number;
}

/**
 * Purchase response structure
 * @see backend: src/payment_service/schemas/response_schema.py
 */
export interface PurchaseResponse {
  message: string;
  new_balance: number;
  tickets: string[];
  total_amount: number;
  transaction: PurchaseTransaction;
}

// #region Service Response Types

/**
 * Payment service response type collection
 */
export interface PaymentServiceResponses {
  balance: ApiResponse<SiteCreditBalance>;
  purchase: ApiResponse<PurchaseResponse>;
  transaction: ApiResponse<PurchaseTransaction>;
}

// #region Flow State Types

/**
 * Purchase flow step enumeration
 */
export enum PurchaseStep {
  BALANCE_CHECK = 'BALANCE_CHECK',
  PROCESSING = 'PROCESSING',
  CONFIRMATION = 'CONFIRMATION',
  ERROR = 'ERROR'
}

/**
 * Purchase flow state interface
 */
export interface PurchaseFlowState {
  currentStep: PurchaseStep;
  reservationId: number | null;
  reservationStatus: ReservationStatus | null;
  balance: SiteCreditBalance | null;
  transaction: PurchaseTransaction | null;
  error: PurchaseError | null;
  isProcessing: boolean;
}

// #region Type Guards

/**
 * Type guard for purchase errors
 */
export function isPurchaseError(value: unknown): value is PurchaseError {
  return (
    typeof value === 'object' &&
    value !== null &&
    'code' in value &&
    'message' in value &&
    Object.values(PurchaseErrorCode).includes((value as PurchaseError).code)
  );
}

/**
 * Type guard for purchase transactions
 */
export function isPurchaseTransaction(
  value: unknown
): value is PurchaseTransaction {
  return (
    typeof value === 'object' &&
    value !== null &&
    'id' in value &&
    'status' in value &&
    Object.values(PurchaseStatus).includes((value as PurchaseTransaction).status)
  );
}

/**
 * Interface for payment actions hook result
 */
export interface UsePaymentActionsResult {
  currentStep: PurchaseStep;
  isProcessing: boolean;
  error: PurchaseError | null;
  transaction: PurchaseTransaction | null;
  processPurchase: (reservationId: number) => Promise<void>;
  resetPurchase: () => void;
}

export interface PurchaseReviewData {
  reservation: TicketReservation;
  available_balance: number;
  payment_methods: {
    site_credit: {
      available: boolean;
      reason?: string;
    };
    payment_gateway: {
      available: boolean;
      providers: PaymentProvider[];
    };
  };
}

export interface PaymentProvider {
  id: string;
  name: string;
  type: 'credit_card' | 'paypal' | 'crypto';
  enabled: boolean;
}