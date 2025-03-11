/**
* Ticket Gameplay Type System
* 
* Orchestrates the complete ticket reveal gameplay loop with:
* - State machine-driven gameplay progression
* - Atomic operation management for consistent game state
* - Player engagement and feedback loops
* - Type-safe interaction patterns
*/

// Core Gameplay State Enums
export enum TicketStatus {
  RESERVED = 'reserved',
  SOLD = 'sold',
  REVEALED = 'revealed',
  DISCOVERED = 'discovered',
  CLAIMED = 'claimed'
 }
 
 export enum PrizeType {
  INSTANT_WIN = 'instant_win',
  DRAW_WIN = 'draw_win',
  NO_WIN = 'no_win'
 }
 
 export enum PrizeValueType {
  CASH = 'cash',
  CREDIT = 'credit',
  RETAIL = 'retail'
 }
 
 // Prize System Types
 export interface PrizeValues {
  [PrizeValueType.CASH]: number;
  [PrizeValueType.CREDIT]: number;
  [PrizeValueType.RETAIL]: number;
 }
 
 export interface RaffleGroupResponse {
  [raffleId: string]: {
    raffle: RaffleContext;
    tickets: Ticket[];
  }
}

 export interface Prize {
  id: string;
  type: PrizeType;
  name: string;
  description?: string;
  values: PrizeValues;
  claimDeadline?: string;
  imageUrl?: string;
 }
 
 export interface ApiResponse<T> {
  data?: T;
  error?: {
    message: string;
    code: string;
  };
}

 // Base Request Type for Gameplay Actions
 interface BaseTicketRequest {
  raffleId: number;
 }
 
 // Gameplay Action Requests
 export interface RevealRequest extends BaseTicketRequest {
  ticketIds: string[];
  parallel?: boolean;
 }
 
 export interface DiscoverRequest extends BaseTicketRequest {
  ticketId: string;
  verificationToken: string;
 }
 
 export interface ClaimRequest extends BaseTicketRequest {
  ticketId: string;
  prizeId: string;
  claimMethod: 'CREDIT' | 'BANK_TRANSFER';
  acceptedTerms: boolean;
 }
 
 // Core Ticket Interface
 export interface Ticket {
  id: number;
  ticket_id: string;
  ticket_number: string;
  raffle_id: number;
  user_id: number;
  status: TicketStatus;
  is_revealed: boolean;
  instant_win_eligible: boolean;
  purchase_time: string | null;
  reveal_time: string | null;
  raffle_title: string;
  reveal_sequence: number | null;
  transaction_id: number | null;
  created_at: string;
  discovered_prize?: Prize;
  claim_status?: {
    claimed: boolean;
    claim_time?: string;
    claim_method?: 'CREDIT' | 'BANK_TRANSFER';
  };
 }
 
 // Gameplay Response Types
 export interface TicketResponse {
  ticket: Ticket;
  operation?: {
    id: string;
    status: 'completed' | 'failed';
    error?: string;
  };
 }
 
 export interface BatchTicketResponse {
  tickets: Ticket[];
  operation: {
    batchId: string;
    completedCount: number;
    failedTickets: string[];
    error?: string;
  };
 }
 
 export interface DiscoverResponse {
  message: string;
  prize: {
    instance_id: string;
    name: string;
    type: PrizeType | string;
    values: PrizeValues;
  };
  raffle_id: number;
  ticket: {
    id: string;
    number: string;
  };
  user_id: number;
}

 // Inventory Management Types
 export interface TicketFilters {
  status?: TicketStatus[];
  raffleId?: number;
  instant_win_eligible?: boolean;
  dateRange?: {
    start: string;
    end: string;
  };
 }
 
 export enum TicketSortField {
  REVEAL_TIME = 'reveal_time',
  PURCHASE_TIME = 'purchase_time',
  TICKET_NUMBER = 'ticket_number'
 }
 
 export interface TicketSort {
  field: TicketSortField;
  ascending: boolean;
 }
 
 // Raffle Context Types
 export enum RaffleState {
  DRAFT = 'draft',
  COMING_SOON = 'coming_soon',
  OPEN = 'open',
  PAUSED = 'paused',
  ENDED = 'ended'
 }
 
 export enum RaffleStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive'
 }
 
 export interface RaffleContext {
  id: number;
  title: string;
  description: string;
  state: RaffleState;
  status: RaffleStatus;
  available_tickets: number;
  total_tickets: number;
  ticket_price: number;
  max_tickets_per_user: number;
  start_time: string;
  end_time: string;
  prize_pool_summary: {
    available_instances: {
      draw_win: number;
      instant_win: number;
    };
    total_instances: number;
    total_value: {
      cash: number;
      credit: number;
      retail: number;
    };
  };
  time_remaining: {
    seconds_to_start: number;
    seconds_to_end: number;
    formatted_time_to_start: string;
    formatted_time_to_end: string;
  };
  is_visible: boolean;
  created_at: string;
  updated_at: string;
 }
 
 // Player Inventory Organization
 export interface TicketGroup {
  raffle: RaffleContext;
  tickets: Ticket[];
 }
 
 export interface MyTicketsResponse {
  [raffleId: string]: {
    raffle: RaffleContext;
    tickets: Ticket[];
  };
 }
 
 // Operation Tracking Types
 export interface TicketOperation {
  ticketId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  startTime: string;
  completedTime?: string;
  attempts: number;
  error?: string;
 }
 
 export interface BatchOperation extends TicketOperation {
  ticketIds: string[];
  processedCount: number;
  failedTickets: string[];
 }
 
 // Gameplay State Management
 export interface PersistedTicketState {
  version: string;
  groups: Record<string, TicketGroup>;
  lastUpdated: string | null;
 }
 
 export interface RuntimeTicketState {
  isLoading: boolean;
  error: string | null;
  activeOperations: Map<string, TicketOperation>;
  batchOperations: Map<string, BatchOperation>;
  animationStates: Map<string, TicketAnimationState>;
 }
 
 // Animation Coordination Types
 export interface RevealAnimation {
  isRevealing: boolean;
  revealSequence: number;
  completedReveal: boolean;
 }
 
 export interface TicketAnimationState {
  reveal: RevealAnimation;
  isLoading: boolean;
  error: string | null;
 }
 
 // Type Guards and Utilities
 export const isTicketOperation = (value: unknown): value is TicketOperation => {
  return (
    typeof value === 'object' &&
    value !== null &&
    'ticketId' in value &&
    'status' in value &&
    'startTime' in value
  );
 };
 
 export const canRevealTicket = (ticket: Ticket): boolean => {
  return ticket.status === TicketStatus.SOLD && !ticket.is_revealed;
 };
 
 export const isActiveBatchOperation = (operation: BatchOperation): boolean => {
  return operation.status === 'pending' || operation.status === 'processing';
 };