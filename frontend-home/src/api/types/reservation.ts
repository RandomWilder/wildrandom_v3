// src/api/types/reservation.ts

/**
 * Reservation Domain Types
 * Defines the core contract between frontend and backend for the reservation system.
 * Ensures type safety and validation for the complete reservation lifecycle.
 */

// Core status enumeration for reservation state machine
export enum ReservationStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  EXPIRED = 'expired',
  CANCELLED = 'cancelled'
}

/**
 * Base reservation entity matching backend schema
 * @interface TicketReservation
 */
export interface TicketReservation {
  id: number;
  raffle_id: number;
  user_id: number;
  status: ReservationStatus;
  ticket_count: number;
  ticket_ids: string[];
  total_amount: number;
  created_at: string;
  expires_at: string;
  completed_at: string | null;
  transaction_id: number | null;
}

/**
 * API request payload for creating reservations
 * @interface ReservationRequest
 */
export interface ReservationRequest {
  quantity: number;
}

/**
 * Next step instruction from API for workflow progression
 * @interface ReservationNextStep
 */
interface ReservationNextStep {
  action: 'purchase';
  endpoint: string;
  method: string;
  payload: {
    reservation_id: number;
  };
}

/**
 * Complete API response for reservation creation
 * @interface ReservationResponse
 */
export interface ReservationResponse {
  available_balance: number;
  next_step: ReservationNextStep;
  reservation: TicketReservation;
}

/**
 * Local state management interface for reservation flow
 * @interface ReservationState
 */
export interface ReservationState {
  currentReservation: TicketReservation | null;
  isLoading: boolean;
  error: string | null;
  expiryTimestamp: number | null;
}

/**
 * API Error Response for Reservation Operations
 * @interface ReservationError
 */
export interface ReservationError {
  error: string;
  details?: {
    available_quantity?: number;
    max_per_user?: number;
  };
}

/**
 * Type guard for reservation errors
 * Enables proper error handling with type narrowing
 */
export const isReservationError = (response: unknown): response is ReservationError => {
  return typeof response === 'object' && 
         response !== null && 
         'error' in response;
};