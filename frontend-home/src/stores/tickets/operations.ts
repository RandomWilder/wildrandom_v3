/**
 * Ticket Operations Management
 * 
 * Orchestrates gaming interactions with optimized patterns:
 * - Parallel animations for enhanced reveal excitement
 * - Priority-based operation queuing
 * - Optimistic UI updates for instant feedback
 * - Smart batching for smooth UX
 */

import { atom } from 'jotai';
import { atomWithDefault } from 'jotai/utils';
import ticketApi from '../../api/ticketApi';
import type {
  RevealRequest,
  DiscoverRequest,
  ClaimRequest
} from '../../features/tickets/types';

// Operation Queue Types
interface QueuedOperation {
  id: string;
  type: 'reveal' | 'discover' | 'claim';
  payload: RevealRequest | DiscoverRequest | ClaimRequest;
  priority: number;
  timestamp: number;
  retryCount: number;
}

interface OperationsState {
  queue: QueuedOperation[];
  activeOperations: Set<string>;
  maxConcurrent: number;
  isProcessing: boolean;
}

const MAX_RETRIES = 3;
const POLLING_INTERVAL = 100;

const initialState: OperationsState = {
  queue: [],
  activeOperations: new Set(),
  maxConcurrent: 3, // Optimal for parallel reveals
  isProcessing: false
};

// Primary Operations Atom
export const operationsStateAtom = atom<OperationsState>(initialState);

// Queue Management
export const queueOperationAtom = atom(
  null,
  async (get, set, operation: QueuedOperation) => {
    set(operationsStateAtom, (prevState: OperationsState) => ({
      ...prevState,
      queue: [...prevState.queue, operation].sort((a, b) => 
        // Sort by priority then timestamp
        b.priority - a.priority || a.timestamp - b.timestamp
      )
    }));

    const currentState = get(operationsStateAtom);
    if (!currentState.isProcessing) {
      set(processQueueAtom);
    }
  }
);

// Queue Processing
export const processQueueAtom = atom(
  null,
  async (get, set) => {
    const currentState = get(operationsStateAtom);
    if (currentState.isProcessing || currentState.queue.length === 0) return;

    set(operationsStateAtom, (prevState: OperationsState) => ({ 
      ...prevState, 
      isProcessing: true 
    }));

    try {
      while (true) {
        const state = get(operationsStateAtom);
        if (state.queue.length === 0) break;

        const availableSlots = state.maxConcurrent - state.activeOperations.size;
        if (availableSlots <= 0) {
          await new Promise(resolve => setTimeout(resolve, POLLING_INTERVAL));
          continue;
        }

        const operationsToProcess = state.queue
          .slice(0, availableSlots)
          .map(queuedOp => processOperation(queuedOp, set));

        await Promise.all(operationsToProcess);
      }
    } finally {
      set(operationsStateAtom, (prevState: OperationsState) => ({ 
        ...prevState, 
        isProcessing: false 
      }));
    }
  }
);

// Operation Processing
async function processOperation(
  operation: QueuedOperation,
  set: Function
): Promise<void> {
  try {
    set(operationsStateAtom, (prevState: OperationsState) => ({
      ...prevState,
      activeOperations: new Set([...prevState.activeOperations, operation.id]),
      queue: prevState.queue.filter(op => op.id !== operation.id)
    }));

    switch (operation.type) {
      case 'reveal':
        await processReveal(operation.payload as RevealRequest);
        break;
      case 'discover':
        await processDiscover(operation.payload as DiscoverRequest);
        break;
      case 'claim':
        await processClaim(operation.payload as ClaimRequest);
        break;
    }
  } catch (error) {
    if (operation.retryCount < MAX_RETRIES) {
      set(queueOperationAtom, {
        ...operation,
        priority: operation.priority - 1,
        timestamp: Date.now(),
        retryCount: operation.retryCount + 1
      });
    }
  } finally {
    set(operationsStateAtom, (prevState: OperationsState) => ({
      ...prevState,
      activeOperations: new Set(
        [...prevState.activeOperations].filter(id => id !== operation.id)
      )
    }));
  }
}

// Type-safe Operation Processors
async function processReveal(request: RevealRequest): Promise<void> {
  const response = await ticketApi.revealTickets(request);
  if (response.error) throw new Error(response.error.message);
}

async function processDiscover(request: DiscoverRequest): Promise<void> {
  const response = await ticketApi.discoverPrize(request);
  if (response.error) throw new Error(response.error.message);
}

async function processClaim(request: ClaimRequest): Promise<void> {
  const response = await ticketApi.claimPrize(request);
  if (response.error) throw new Error(response.error.message);
}

// Progress Tracking
export const operationProgressAtom = atomWithDefault((get) => {
  const state = get(operationsStateAtom);
  return {
    queueLength: state.queue.length,
    activeCount: state.activeOperations.size,
    isProcessing: state.isProcessing
  };
});

// Operation Factory Functions
export function createRevealOperation(
  ticketIds: string[],
  parallel = true
): QueuedOperation {
  return {
    id: `reveal-${Date.now()}-${Math.random()}`,
    type: 'reveal',
    payload: { ticketIds, parallel },
    priority: 1,
    timestamp: Date.now(),
    retryCount: 0
  };
}

export function createDiscoverOperation(
  ticketId: string,
  verificationToken: string
): QueuedOperation {
  return {
    id: `discover-${ticketId}`,
    type: 'discover',
    payload: { ticketId, verificationToken },
    priority: 2, // Higher priority than reveal
    timestamp: Date.now(),
    retryCount: 0
  };
}

export function createClaimOperation(
  ticketId: string,
  prizeId: string,
  claimMethod: 'CREDIT' | 'BANK_TRANSFER'
): QueuedOperation {
  return {
    id: `claim-${ticketId}`,
    type: 'claim',
    payload: { 
      ticketId, 
      prizeId, 
      claimMethod,
      acceptedTerms: true 
    },
    priority: 3, // Highest priority
    timestamp: Date.now(),
    retryCount: 0
  };
}