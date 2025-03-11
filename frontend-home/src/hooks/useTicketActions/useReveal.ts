/**
 * Reveal Action Hook
 * 
 * Manages ticket reveal animations and state transitions with:
 * - Fluid reveal sequences for heightened anticipation
 * - Batch reveal coordination for combo effects
 * - Tactile feedback integration
 * - Fallback handling for seamless gameplay
 */

import { useCallback, useState } from 'react';
import { useAtom } from 'jotai';
import { runtimeTicketStateAtom } from '../../stores/tickets';
import { 
  startOperation, 
  completeOperation,
  ticketActionsAtom 
} from '../../stores/tickets/actions';
import ticketApi from '../../api/ticketApi';

interface RevealState {
  isRevealing: boolean;
  completedTickets: string[];
  failedTickets: string[];
}

interface UseRevealProps {
  onRevealStart?: () => void;
  onRevealComplete?: (ticketId: string) => void;
  onRevealFail?: (ticketId: string, error: string) => void;
  onBatchComplete?: (ticketIds: string[]) => void;
}

interface UseRevealResult {
  // Reveal State
  isRevealing: boolean;
  completedTickets: string[];
  failedTickets: string[];
  progress: number;

  // Actions
  revealTicket: (ticketId: string) => Promise<void>;
  revealBatch: (ticketIds: string[]) => Promise<void>;
  resetRevealState: () => void;
}

export function useReveal({
  onRevealStart,
  onRevealComplete,
  onRevealFail,
  onBatchComplete
}: UseRevealProps = {}): UseRevealResult {
  // Local reveal state for animation control
  const [revealState, setRevealState] = useState<RevealState>({
    isRevealing: false,
    completedTickets: [],
    failedTickets: []
  });

  const [, dispatch] = useAtom(ticketActionsAtom);

  // Single ticket reveal
  const revealTicket = useCallback(async (ticketId: string) => {
    try {
      setRevealState(prev => ({
        ...prev,
        isRevealing: true
      }));
      onRevealStart?.();

      dispatch(startOperation(ticketId));
      
      const response = await ticketApi.revealTickets({
        ticketIds: [ticketId],
        parallel: false
      });

      if (response.error) {
        setRevealState(prev => ({
          ...prev,
          failedTickets: [...prev.failedTickets, ticketId]
        }));
        onRevealFail?.(ticketId, response.error.message);
        return;
      }

      setRevealState(prev => ({
        ...prev,
        completedTickets: [...prev.completedTickets, ticketId]
      }));
      onRevealComplete?.(ticketId);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Reveal failed';
      onRevealFail?.(ticketId, errorMessage);
      
    } finally {
      dispatch(completeOperation(ticketId));
      setRevealState(prev => ({
        ...prev,
        isRevealing: false
      }));
    }
  }, [dispatch, onRevealStart, onRevealComplete, onRevealFail]);

  // Batch reveal with parallel processing
  const revealBatch = useCallback(async (ticketIds: string[]) => {
    try {
      setRevealState(prev => ({
        ...prev,
        isRevealing: true
      }));
      onRevealStart?.();

      // Start operations for all tickets
      ticketIds.forEach(id => dispatch(startOperation(id)));

      const response = await ticketApi.revealTickets({
        ticketIds,
        parallel: true
      });

      if (response.error) {
        setRevealState(prev => ({
          ...prev,
          failedTickets: [...prev.failedTickets, ...ticketIds]
        }));
        ticketIds.forEach(id => onRevealFail?.(id, response.error!.message));
        return;
      }

      setRevealState(prev => ({
        ...prev,
        completedTickets: [...prev.completedTickets, ...ticketIds]
      }));
      
      onBatchComplete?.(ticketIds);
      ticketIds.forEach(id => onRevealComplete?.(id));

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Batch reveal failed';
      ticketIds.forEach(id => onRevealFail?.(id, errorMessage));
      
    } finally {
      ticketIds.forEach(id => dispatch(completeOperation(id)));
      setRevealState(prev => ({
        ...prev,
        isRevealing: false
      }));
    }
  }, [dispatch, onRevealStart, onRevealComplete, onRevealFail, onBatchComplete]);

  const resetRevealState = useCallback(() => {
    setRevealState({
      isRevealing: false,
      completedTickets: [],
      failedTickets: []
    });
  }, []);

  // Calculate reveal progress for UI feedback
  const progress = revealState.isRevealing ? 
    (revealState.completedTickets.length + revealState.failedTickets.length) /
    (revealState.completedTickets.length + revealState.failedTickets.length) * 100 : 0;

  return {
    // State
    isRevealing: revealState.isRevealing,
    completedTickets: revealState.completedTickets,
    failedTickets: revealState.failedTickets,
    progress,

    // Actions
    revealTicket,
    revealBatch,
    resetRevealState
  };
}