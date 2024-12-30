import { PrizePoolSummary } from '@/types/prizes/pools';

// Enums for state management
export enum RaffleStatus {
  INACTIVE = 'inactive',
  ACTIVE = 'active',
  CANCELLED = 'cancelled'
}

export enum RaffleState {
  DRAFT = 'draft',
  COMING_SOON = 'coming_soon',
  OPEN = 'open',
  PAUSED = 'paused',
  ENDED = 'ended'
}

export enum TicketStatus {
  AVAILABLE = 'available',
  RESERVED = 'reserved',
  SOLD = 'sold',
  REVEALED = 'revealed',
  EXPIRED = 'expired',
  VOID = 'void'
}

// Core domain models
export interface Raffle {
  id: number;
  title: string;
  description?: string;
  prize_pool_id: number;
  total_tickets: number;
  ticket_price: number;
  max_tickets_per_user: number;
  start_time: string;
  end_time: string;
  status: RaffleStatus;
  state: RaffleState;
  created_at: string;
  updated_at?: string;
  is_visible: boolean;
  time_remaining: TimeRemaining;
  prize_pool_summary?: PrizePoolSummary;
}

export interface TimeRemaining {
  seconds_to_start: number;
  seconds_to_end: number;
  formatted_time_to_start: string;
  formatted_time_to_end: string;
}

export interface Ticket {
  id: number;
  ticket_id: string;
  ticket_number: string;
  raffle_id: number;
  user_id?: number;
  status: TicketStatus;
  instant_win_eligible: boolean;
  is_revealed: boolean;
  reveal_time?: string;
  reveal_sequence?: number;
  purchase_time?: string;
  transaction_id?: number;
  created_at: string;
}

export interface DrawResult {
  id: number;
  raffle_id: number;
  ticket_id: string;
  draw_sequence: number;
  prize_instance_id: number;
  result: 'winner' | 'no_winner';
  drawn_at: string;
  processed_at?: string;
  ticket_details?: {
    number: string;
    user_id?: number;
    reveal_time?: string;
  };
  prize_details?: {
    instance_id: string;
    type: string;
    status: string;
    values: {
      retail: number;
      cash: number;
      credit: number;
    };
  };
}

// API Payloads
export interface RaffleCreatePayload {
  title: string;
  description?: string;
  prize_pool_id: number;
  total_tickets: number;
  ticket_price: number;
  max_tickets_per_user: number;
  start_time: string;
  end_time: string;
}

export interface RaffleUpdatePayload {
  title?: string;
  description?: string;
  ticket_price?: number;
  max_tickets_per_user?: number;
  start_time?: string;
  end_time?: string;
}

export interface StatusUpdatePayload {
  status: RaffleStatus;
  reason?: string;
}

export interface StateUpdatePayload {
  state: RaffleState;
  reason?: string;
}

// Statistics and Filters
export interface RaffleStats {
  total_tickets: number;
  available_tickets: number;
  sold_tickets: number;
  revealed_tickets: number;
  eligible_tickets: number;
  instant_wins_discovered: number;
  unique_participants: number;
}

export interface TicketFilter {
  status?: TicketStatus;
  user_id?: number;
  revealed?: boolean;
  instant_win?: boolean;
  limit?: number;
}

// Reservation Models
export interface TicketReservation {
  id: number;
  user_id: number;
  raffle_id: number;
  ticket_ids: string[];
  total_amount: number;
  expires_at: string;
  status: 'pending' | 'completed' | 'expired' | 'cancelled';
  created_at: string;
  completed_at?: string;
  transaction_id?: number;
}

// History and Audit
export interface RaffleHistory {
  id: number;
  raffle_id: number;
  previous_status: RaffleStatus;
  new_status: RaffleStatus;
  previous_state: RaffleState;
  new_state: RaffleState;
  changed_by_id?: number;
  reason?: string;
  created_at: string;
}

// Response Types
export interface RaffleResponse {
  raffle: Raffle;
  message?: string;
}

export interface DrawResponse {
  draws: DrawResult[];
  message: string;
}

export interface TicketResponse {
  tickets: Ticket[];
  total: number;
}

// Utility Types
export type RaffleId = number;
export type TicketId = string;

export interface ValidationResult {
  isValid: boolean;
  errors?: string[];
}

export interface PublicStatsResponse {
  total_tickets: number;
  available_tickets: number;
  sold_tickets: number;
  revealed_tickets: number;
  eligible_tickets: number;  // Adding this required field
  instant_wins_discovered: number;
  unique_participants: number;
}

export interface RaffleStats extends PublicStatsResponse {
  // Any additional fields specific to RaffleStats can be added here
  // This ensures RaffleStats has at least all fields from PublicStatsResponse
}