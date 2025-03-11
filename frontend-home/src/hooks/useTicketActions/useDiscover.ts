/**
 * Prize Discovery Hook
 * 
 * Orchestrates the prize discovery sequence with:
 * - Multi-stage reveal for maximum anticipation
 * - Progressive animation states
 * - Tactile feedback triggers
 * - Prize-specific celebrations
 */

import { useCallback, useState } from 'react';
import { useAtom } from 'jotai';
import { ticketActionsAtom } from '../../stores/tickets/actions';
import ticketApi from '../../api/ticketApi';
import type { Ticket, TicketResponse } from '../../features/tickets/types';

// Discovery sequence stages for choreographed reveals
enum DiscoveryStage {
  IDLE = 'idle',
  INITIATING = 'initiating',
  REVEALING = 'revealing',
  CELEBRATING = 'celebrating',
  COMPLETED = 'completed',
  FAILED = 'failed'
}

interface DiscoveryState {
  stage: DiscoveryStage;
  ticket: Ticket | null;
  error: string | null;
}

interface UseDiscoverProps {
  // Stage transition callbacks for animations
  onInitiate?: () => void;
  onRevealStart?: () => void;
  onPrizeRevealed?: (ticket: Ticket) => void;
  onComplete?: () => void;
  onError?: (error: string) => void;
}

interface UseDiscoverResult {
  // Discovery State
  stage: DiscoveryStage;
  ticket: Ticket | null;
  error: string | null;
  isDiscovering: boolean;

  // Player Actions
  discoverPrize: (ticketId: string, verificationToken: string) => Promise<void>;
  resetDiscovery: () => void;

  // Stage Checks
  isStage: (stage: DiscoveryStage) => boolean;
}

export function useDiscover({
  onInitiate,
  onRevealStart,
  onPrizeRevealed,
  onComplete,
  onError
}: UseDiscoverProps = {}): UseDiscoverResult {
  const [discoveryState, setDiscoveryState] = useState<DiscoveryState>({
    stage: DiscoveryStage.IDLE,
    ticket: null,
    error: null
  });

  const [, dispatch] = useAtom(ticketActionsAtom);

  const discoverPrize = useCallback(async (
    ticketId: string,
    verificationToken: string
  ) => {
    try {
      // Initiate discovery sequence
      setDiscoveryState(prev => ({
        ...prev,
        stage: DiscoveryStage.INITIATING,
        error: null
      }));
      onInitiate?.();

      // Begin reveal sequence
      setDiscoveryState(prev => ({
        ...prev,
        stage: DiscoveryStage.REVEALING
      }));
      onRevealStart?.();

      const response = await ticketApi.discoverPrize({
        ticketId,
        verificationToken
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      const updatedTicket = (response.data as TicketResponse).ticket;

      // Trigger prize celebration
      setDiscoveryState(prev => ({
        ...prev,
        stage: DiscoveryStage.CELEBRATING,
        ticket: updatedTicket
      }));
      onPrizeRevealed?.(updatedTicket);

      // Complete discovery sequence
      setDiscoveryState(prev => ({
        ...prev,
        stage: DiscoveryStage.COMPLETED
      }));
      onComplete?.();

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Prize discovery failed';
      
      setDiscoveryState(prev => ({
        ...prev,
        stage: DiscoveryStage.FAILED,
        error: errorMessage
      }));
      
      onError?.(errorMessage);
    }
  }, [onInitiate, onRevealStart, onPrizeRevealed, onComplete, onError]);

  const resetDiscovery = useCallback(() => {
    setDiscoveryState({
      stage: DiscoveryStage.IDLE,
      ticket: null,
      error: null
    });
  }, []);

  const isStage = useCallback((stage: DiscoveryStage) => {
    return discoveryState.stage === stage;
  }, [discoveryState.stage]);

  return {
    // Discovery State
    stage: discoveryState.stage,
    ticket: discoveryState.ticket,
    error: discoveryState.error,
    isDiscovering: [
      DiscoveryStage.INITIATING,
      DiscoveryStage.REVEALING,
      DiscoveryStage.CELEBRATING
    ].includes(discoveryState.stage),

    // Player Actions
    discoverPrize,
    resetDiscovery,

    // Stage Utilities
    isStage
  };
}