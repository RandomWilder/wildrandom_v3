/**
 * Ticket Store Implementation
 * 
 * Implements atomic state management for ticket gameplay with:
 * - Operation queuing for smooth animations
 * - Optimistic updates with rollback
 * - Real-time state synchronization
 * - Performance-optimized re-renders
 */

import { atom } from 'jotai';
import { atomWithStorage } from 'jotai/utils';
import type { 
  PersistedTicketState,
  RuntimeTicketState,
  TicketOperation,
  TicketGroup,
  MyTicketsResponse,
  TicketAnimationState,
  BatchOperation
} from '../../features/tickets/types';

// Initial States
const initialPersistedState: PersistedTicketState = {
  version: '1.0.0',
  groups: {},
  lastUpdated: null
};

const initialRuntimeState: RuntimeTicketState = {
  isLoading: false,
  error: null,
  activeOperations: new Map(),
  batchOperations: new Map(),
  animationStates: new Map()
};

// Core State Atoms
export const persistedTicketStateAtom = atomWithStorage<PersistedTicketState>(
  'tickets_v1',
  initialPersistedState,
  {
    getItem: (key: string, initialValue: PersistedTicketState): PersistedTicketState => {
      const storedValue = localStorage.getItem(key);
      if (!storedValue) return initialValue;

      try {
        const parsed = JSON.parse(storedValue);
        // Version check for storage migrations
        if (parsed.version !== initialValue.version) {
          localStorage.removeItem(key);
          return initialValue;
        }
        return parsed;
      } catch {
        localStorage.removeItem(key);
        return initialValue;
      }
    },
    setItem: (key: string, value: PersistedTicketState): void => {
      localStorage.setItem(key, JSON.stringify(value));
    },
    removeItem: (key: string): void => {
      localStorage.removeItem(key);
    }
  }
);

export const runtimeTicketStateAtom = atom<RuntimeTicketState>(initialRuntimeState);

// Computed State Selectors
export const activeTicketsAtom = atom((get) => {
  const { groups } = get(persistedTicketStateAtom);
  return Object.values(groups).flatMap(group => group.tickets);
});

export const activeOperationsAtom = atom((get) => {
  const { activeOperations } = get(runtimeTicketStateAtom);
  return Array.from(activeOperations.values())
    .filter(op => op.status === 'pending' || op.status === 'processing');
});

export const pendingOperationsAtom = atom((get) => {
  const { activeOperations } = get(runtimeTicketStateAtom);
  return Array.from(activeOperations.values())
    .filter(op => op.status === 'pending');
});

// Operation Management Atoms
export const operationByIdAtom = atom(
  (get) => (ticketId: string): TicketOperation | undefined => {
    const { activeOperations } = get(runtimeTicketStateAtom);
    return activeOperations.get(ticketId);
  }
);

export const batchOperationByIdAtom = atom(
  (get) => (batchId: string): BatchOperation | undefined => {
    const { batchOperations } = get(runtimeTicketStateAtom);
    return batchOperations.get(batchId);
  }
);

// Animation State Management
export const ticketAnimationStateAtom = atom(
  (get) => (ticketId: string): TicketAnimationState | undefined => {
    const { animationStates } = get(runtimeTicketStateAtom);
    return animationStates.get(ticketId);
  }
);

// State Update Helpers
export const updateTicketGroupsAtom = atom(
  null,
  (get, set, response: MyTicketsResponse) => {
    set(persistedTicketStateAtom, prev => ({
      ...prev,
      groups: Object.entries(response).reduce((acc, [raffleId, data]) => {
        acc[raffleId] = {
          raffle: data.raffle,
          tickets: data.tickets.sort((a, b) => {
            // Sort by reveal sequence, then ticket number
            if (a.reveal_sequence && b.reveal_sequence) {
              return a.reveal_sequence - b.reveal_sequence;
            }
            return a.ticket_number.localeCompare(b.ticket_number);
          })
        };
        return acc;
      }, {} as Record<string, TicketGroup>),
      lastUpdated: new Date().toISOString()
    }));
  }
);

export const startOperationAtom = atom(
  null,
  (get, set, ticketId: string) => {
    set(runtimeTicketStateAtom, prev => ({
      ...prev,
      activeOperations: new Map(prev.activeOperations).set(ticketId, {
        ticketId,
        status: 'pending',
        startTime: new Date().toISOString(),
        attempts: 0
      })
    }));
  }
);

export const completeOperationAtom = atom(
  null,
  (get, set, { ticketId, success, error }: { ticketId: string; success: boolean; error?: string }) => {
    set(runtimeTicketStateAtom, prev => ({
      ...prev,
      activeOperations: new Map(prev.activeOperations).set(ticketId, {
        ticketId,
        status: success ? 'completed' : 'failed',
        startTime: prev.activeOperations.get(ticketId)?.startTime || new Date().toISOString(),
        completedTime: new Date().toISOString(),
        attempts: (prev.activeOperations.get(ticketId)?.attempts || 0) + 1,
        ...(error ? { error } : {})
      })
    }));
  }
);

// Animation Control
export const startAnimationAtom = atom(
  null,
  (get, set, { ticketId, type }: { ticketId: string; type: 'reveal' | 'discover' }) => {
    set(runtimeTicketStateAtom, prev => ({
      ...prev,
      animationStates: new Map(prev.animationStates).set(ticketId, {
        reveal: {
          isRevealing: type === 'reveal',
          revealSequence: type === 'reveal' ? 
            (prev.animationStates.get(ticketId)?.reveal.revealSequence || 0) + 1 : 0,
          completedReveal: false
        },
        isLoading: true,
        error: null
      })
    }));
  }
);

// Error Handling
export const setErrorAtom = atom(
  null,
  (get, set, error: string | null) => {
    set(runtimeTicketStateAtom, prev => ({
      ...prev,
      error
    }));
  }
);