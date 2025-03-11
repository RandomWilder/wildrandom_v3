/**
 * Ticket Store Types
 * 
 * Defines core state patterns for ticket management with gaming-optimized structures.
 * Ensures type safety across the ticket lifecycle while maintaining clear state transitions
 * for enhanced player feedback.
 */

import type { 
    TicketGroup,
    TicketOperation,
    BatchOperation 
  } from '../../features/tickets/types';
  
  // Loading States
  export interface LoadingState {
    isLoading: boolean;
    error: string | null;
  }
  
  // Persisted State Pattern
  export interface PersistedTicketState {
    version: string;
    tickets: TicketGroup[];
    lastUpdated: string | null;
  }
  
  // Runtime State Extensions
  export interface RuntimeTicketState extends LoadingState {
    activeOperations: Map<string, TicketOperation>;
    batchOperations: Map<string, BatchOperation>;
    refreshInterval: number | null;
  }
  
  // Combined State Pattern
  export interface TicketStoreState {
    persistent: PersistedTicketState;
    runtime: RuntimeTicketState;
  }
  
  // Operation Result Types
  export interface OperationResult<T> {
    success: boolean;
    data?: T;
    error?: string;
  }
  
  // Action Results
  export interface TicketActionResult {
    success: boolean;
    ticketId: string;
    error?: string;
    timestamp: string;
  }
  
  export interface BatchActionResult {
    success: boolean;
    ticketIds: string[];
    failedIds: string[];
    error?: string;
    timestamp: string;
  }
  
  // Gaming Session Context
  export interface GameplayContext {
    sessionId: string;
    startTime: string;
    lastInteraction: string;
    revealStreak: number;
    discoveryBonus: boolean;
  }