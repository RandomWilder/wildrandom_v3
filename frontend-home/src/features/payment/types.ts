/**
 * Payment Feature Types
 * 
 * Core type definitions for the payment subsystem, integrated with
 * reservation management and aligned with backend payment service.
 * 
 * Architectural Considerations:
 * - Type safety across subsystem boundaries
 * - Backend service alignment
 * - State management integration
 */

import type { ReservationStatus } from '../../api/types/reservation';

// #region Core Domain Types
export interface SiteCreditBalance {
  user_id: number;
  available_amount: number;
  pending_amount: number;
  last_updated: string;
}

// #region Transaction States
export enum PurchaseStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  ROLLED_BACK = 'rolled_back'
}

export enum ReferenceType {
  TICKET_PURCHASE = 'ticket_purchase',
  PRIZE_CLAIM = 'prize_claim',
  REFUND = 'refund',
  ADJUSTMENT = 'adjustment'
}

// #region Domain Models
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

// #region API Contracts
export interface PurchaseResponse {
  transaction: PurchaseTransaction;
  message: string;
  tickets: string[];
  total_amount: number;
  new_balance: number;
}

export interface PurchaseRequest {
  reservation_id: number;
}

// #region Flow State Management
export enum PurchaseStep {
  BALANCE_CHECK = 'BALANCE_CHECK',
  PROCESSING = 'PROCESSING',
  CONFIRMATION = 'CONFIRMATION',
  ERROR = 'ERROR'
}

export interface PurchaseFlowState {
  currentStep: PurchaseStep;
  reservationId: number | null;
  reservationStatus: ReservationStatus | null;
  balance: SiteCreditBalance | null;
  transaction: PurchaseTransaction | null;
  error: PurchaseError | null;
  isProcessing: boolean;
}