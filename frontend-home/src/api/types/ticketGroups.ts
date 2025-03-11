/**
 * Ticket Groups Type System
 * 
 * Implements comprehensive type definitions for the ticket groups API with:
 * - Strict type checking
 * - Runtime validation
 * - Response transformations
 * - Error boundaries
 */

import { ApiResponse } from './common';

// Core State Enums
export enum RaffleState {
  DRAFT = 'draft',
  COMING_SOON = 'coming_soon',
  OPEN = 'open',
  PAUSED = 'paused',
  ENDED = 'ended'
}

// Response Interfaces
export interface TicketGroupTimestamps {
  end_time: string;
  start_time: string;
  timezone: string;
}

export interface TicketGroupTimeRemaining {
  seconds_to_end: number;
  seconds_to_start: number;
  formatted_time_to_end: string;
  formatted_time_to_start: string;
}

export interface TicketGroupParticipation {
  revealed_percentage: number;
  has_winning_tickets: boolean;
}

export interface TicketGroupCardMetrics {
  progress_percentage: number;
  action_required: boolean;
  swipe_enabled: boolean;
}

export interface TicketGroup {
    raffle_id: number;
    title: string;
    slug: string;
    total_tickets: number;
    unrevealed_tickets: number;
    raffle_state: string;
    is_active: boolean;
    
    participation_status: {
      has_winning_tickets: boolean;
      revealed_percentage: number;
    };
    
    time_remaining: {
      seconds_to_end: number;
      seconds_to_start: number;
      formatted_time_to_end: string;
      formatted_time_to_start: string;
    };
    
    timestamps: {
      end_time: string;
      start_time: string;
      timezone: string;
    };
    
    card_metrics: {
      action_required: boolean;
      progress_percentage: number;
      swipe_enabled: boolean;
    };
  }

  export interface TicketGroupResponse {
    data?: TicketGroup[];
    error?: {
      message: string;
      code: string;
    };
  }
  
  

// API Response Types
export type TicketGroupsResponse = ApiResponse<TicketGroup[]>;

// Type Guards
export const isTicketGroup = (value: unknown): value is TicketGroup => {
  return (
    typeof value === 'object' &&
    value !== null &&
    'raffle_id' in value &&
    'slug' in value &&
    'title' in value &&
    'total_tickets' in value &&
    'unrevealed_tickets' in value &&
    'raffle_state' in value &&
    'is_active' in value
  );
};

// Error Types
export interface TicketGroupError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

// Utility Types
export interface TicketGroupFilters {
  active_only?: boolean;
  has_unrevealed?: boolean;
  raffle_state?: RaffleState[];
}

export interface TicketGroupSort {
  field: 'end_time' | 'start_time' | 'total_tickets' | 'unrevealed_tickets';
  direction: 'asc' | 'desc';
}

// Request Configuration
export interface TicketGroupRequestConfig {
  filters?: TicketGroupFilters;
  sort?: TicketGroupSort;
  include_metrics?: boolean;
}