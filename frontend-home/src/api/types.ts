// src/api/types.ts

/**
* Core API Types Module
* Defines the contract between frontend and backend services, providing type 
* safety and consistent interface patterns across the application.
* 
* @module api/types
*/

// #region Raffle Core Types
/**
* Comprehensive raffle entity interface aligning with backend schema
* @interface Raffle
*/
export interface Raffle {
  id: number;
  title: string;
  description: string;
  available_tickets: number;
  total_tickets: number;
  ticket_price: number;
  max_tickets_per_user: number;
  prize_pool_id: number;
  start_time: string;
  end_time: string;
  state: 'draft' | 'coming_soon' | 'open' | 'paused' | 'ended';
  status: 'active' | 'inactive' | 'cancelled';
  is_visible: boolean;
  created_at: string;
  updated_at: string;
  time_remaining: {
    seconds_to_start: number;
    seconds_to_end: number;
    formatted_time_to_start: string;
    formatted_time_to_end: string;
  };
  prize_pool_summary?: {
    total_instances: number;
    available_instances: {
      draw_win: number;
      instant_win: number;
    };
    total_value: {
      retail: number;
      cash: number;
      credit: number;
    };
  };
 }
 // #endregion
 
 // #region API Response Interfaces
 /**
 * API response types for various raffle operations
 */
 export interface RaffleListResponse {
  raffles: Raffle[];
 }
 
 export interface TicketRevealRequest {
  ticket_ids: string[];
 }
 
 export interface TicketRevealResponse {
  tickets: Array<{
    ticket_id: string;
    ticket_number: string;
    status: string;
    reveal_time: string;
    instant_win_eligible: boolean;
  }>;
 }
 
 export interface ReservationRequest {
  quantity: number;
 }
 
 export interface ReservationResponse {
  reservation: {
    id: number;
    ticket_ids: string[];
    total_amount: number;
    expires_at: string;
  };
  next_step: {
    action: string;
    endpoint: string;
    method: string;
    payload: {
      reservation_id: number;
    };
  };
 }
 
 export interface RaffleStatsResponse {
  total_tickets: number;
  available_tickets: number;
  participants: number;
  revealed_tickets: number;
 }
 // #endregion
 
 // #region Error Handling Types
 /**
 * Standardized error response interface
 * @interface ApiError
 */
 export interface ApiError {
  error: string;
  status?: number;
  details?: Record<string, string[]>;
 }
 
 /**
 * Generic API response type that can be either successful data or an error
 * @template T The expected successful response data type
 */
 export type ApiResponse<T> = T | ApiError;
 
 /**
 * Type guard for API error responses
 * @param response - The response to check
 * @returns boolean indicating if response is an error
 */
 export const isApiError = (response: unknown): response is ApiError => {
  return typeof response === 'object' && 
         response !== null && 
         'error' in response;
 };
 // #endregion