// src/api/types/reservation.ts

/**
 * Reservation Domain Types
 * Defines the core contract between frontend and backend for the reservation system
 */

export interface TicketReservation {
    id: number;
    user_id: number;
    raffle_id: number;
    ticket_ids: string[];
    total_amount: number;
    expires_at: string;
    status: ReservationStatus;
    created_at: string;
  }
  
  export enum ReservationStatus {
    PENDING = 'pending',
    COMPLETED = 'completed',
    EXPIRED = 'expired',
    CANCELLED = 'cancelled'
  }
  
  export interface ReservationRequest {
    quantity: number;
  }
  
  export interface ReservationResponse {
    reservation: TicketReservation;
    next_step: {
      action: 'purchase';
      endpoint: string;
      method: string;
      payload: {
        reservation_id: number;
      };
    };
  }
  
  export interface ReservationState {
    currentReservation: TicketReservation | null;
    isLoading: boolean;
    error: string | null;
    expiryTimestamp: number | null;
  }
  
  /**
   * API Error Response for Reservation Operations
   */
  export interface ReservationError {
    error: string;
    details?: {
      available_quantity?: number;
      max_per_user?: number;
    };
  }
  
  // Type guard for reservation errors
  export const isReservationError = (response: unknown): response is ReservationError => {
    return typeof response === 'object' && 
           response !== null && 
           'error' in response;
  };