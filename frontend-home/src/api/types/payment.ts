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
import type { ReservationStatus } from './reservation';

// #region Domain Models

/**
 * User balance information aligned with Balance model
 * @see backend: src/payment_service/models/balance.py
 */
export interface SiteCreditBalance {
  user_id: number;
  available_amount: number;
  pending_amount: number;
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
  meta_data?: {
    reservation_id?: number;
    ticket_ids?: string[];
    failure_reason?: string;
    rollback_reason?: string;
  };
  created_at: string;
  completed_at?: string;
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
  transaction: PurchaseTransaction;
  message: string;
  tickets: string[];
  total_amount: number;
  new_balance: number;
}

// #region Service Response Types

/**
 * Payment service response type collection
 * Ensures proper typing for all service endpoints
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
 * Implements proper null safety and type constraints
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
export function isPurchaseError(error: unknown): error is PurchaseError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    'message' in error &&
    Object.values(PurchaseErrorCode).includes((error as PurchaseError).code)
  );
}

/**
 * Type guard for purchase transactions
 */
export function isPurchaseTransaction(
  transaction: unknown
): transaction is PurchaseTransaction {
  return (
    typeof transaction === 'object' &&
    transaction !== null &&
    'id' in transaction &&
    'status' in transaction &&
    Object.values(PurchaseStatus).includes((transaction as PurchaseTransaction).status)
  );
}