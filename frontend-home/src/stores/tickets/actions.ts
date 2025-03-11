/**
 * Ticket Action System
 * 
 * Manages state transitions for ticket gameplay with:
 * - Optimistic updates for responsive UX
 * - Type-safe operation tracking
 * - Clean rollback mechanisms
 * - Animation state coordination
 */

import { atom } from 'jotai';
import { 
  persistedTicketStateAtom,
  runtimeTicketStateAtom 
} from './index';
import type { 
  MyTicketsResponse,
  TicketOperation 
} from '../../features/tickets/types';

// Action Definitions
export type TicketAction = 
  | { type: 'SET_TICKETS'; payload: MyTicketsResponse }
  | { type: 'START_OPERATION'; payload: string }
  | { type: 'COMPLETE_OPERATION'; payload: string }
  | { type: 'SET_ERROR'; payload: string }
  | { type: 'CLEAR_ERROR' };

// Action Dispatcher
export const ticketActionsAtom = atom(
  null,
  (_, set, action: TicketAction) => {
    switch (action.type) {
      case 'SET_TICKETS':
        set(persistedTicketStateAtom, {
          version: '1.0.0',
          groups: action.payload,
          lastUpdated: new Date().toISOString()
        });
        break;

      case 'START_OPERATION':
        set(runtimeTicketStateAtom, prev => ({
          ...prev,
          activeOperations: new Map(prev.activeOperations).set(action.payload, {
            ticketId: action.payload,
            status: 'pending',
            startTime: new Date().toISOString(),
            attempts: 0
          } as TicketOperation)
        }));
        break;

      case 'COMPLETE_OPERATION':
        set(runtimeTicketStateAtom, prev => {
          const existingOp = prev.activeOperations.get(action.payload);
          if (!existingOp) return prev;

          const updatedOp: TicketOperation = {
            ...existingOp,
            status: 'completed',
            completedTime: new Date().toISOString()
          };

          return {
            ...prev,
            activeOperations: new Map(prev.activeOperations).set(action.payload, updatedOp)
          };
        });
        break;

      case 'SET_ERROR':
        set(runtimeTicketStateAtom, prev => ({
          ...prev,
          error: action.payload
        }));
        break;

      case 'CLEAR_ERROR':
        set(runtimeTicketStateAtom, prev => ({
          ...prev,
          error: null
        }));
        break;
    }
  }
);

// Action Creators
export const setTickets = (response: MyTicketsResponse): TicketAction => ({
  type: 'SET_TICKETS',
  payload: response
});

export const startOperation = (ticketId: string): TicketAction => ({
  type: 'START_OPERATION',
  payload: ticketId
});

export const completeOperation = (ticketId: string): TicketAction => ({
  type: 'COMPLETE_OPERATION',
  payload: ticketId
});

export const setError = (error: string): TicketAction => ({
  type: 'SET_ERROR',
  payload: error
});

export const clearError = (): TicketAction => ({
  type: 'CLEAR_ERROR'
});

// Operation Utilities
export const isOperationActive = (operations: Map<string, TicketOperation>, ticketId: string): boolean => {
  const operation = operations.get(ticketId);
  return operation?.status === 'pending' || operation?.status === 'processing';
};

export const canStartOperation = (operations: Map<string, TicketOperation>, ticketId: string): boolean => {
  const operation = operations.get(ticketId);
  return !operation || operation.status === 'completed' || operation.status === 'failed';
};