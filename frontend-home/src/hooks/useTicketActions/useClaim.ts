/**
 * Prize Claim Hook
 * 
 * Orchestrates the final stage of ticket progression with:
 * - Multi-stage claim sequence for enhanced anticipation
 * - Celebration animations and feedback
 * - Clean state resolution
 * - Error recovery paths
 */

import { useCallback, useState } from 'react';
import { useAtom } from 'jotai';
import { ticketActionsAtom } from '../../stores/tickets/actions';
import ticketApi from '../../api/ticketApi';
import type { Ticket, TicketResponse } from '../../features/tickets/types';

/**
 * Claim stages for progressive feedback
 */
enum ClaimStage {
  IDLE = 'idle',
  VALIDATING = 'validating',
  PROCESSING = 'processing',
  DELIVERING = 'delivering',
  COMPLETED = 'completed',
  FAILED = 'failed'
}

/**
 * Claim state tracking
 */
interface ClaimState {
  stage: ClaimStage;
  ticket: Ticket | null;
  error: string | null;
  claimTimestamp: string | null;
}

/**
 * Hook configuration for stage transitions
 */
interface UseClaimProps {
  onClaimStart?: () => void;       // Initial claim trigger
  onValidated?: () => void;        // Eligibility confirmed
  onSuccess?: (ticket: Ticket) => void;  // Claim completed
  onError?: (error: string) => void;     // Error handling
}

/**
 * Hook result interface
 */
interface UseClaimResult {
  // Current State
  stage: ClaimStage;
  ticket: Ticket | null;
  error: string | null;
  claimTimestamp: string | null;
  isClaiming: boolean;

  // Actions
  claimPrize: (ticketId: string, prizeId: string) => Promise<void>;
  resetClaim: () => void;
}

export function useClaim({
  onClaimStart,
  onValidated,
  onSuccess,
  onError
}: UseClaimProps = {}): UseClaimResult {
  // Local state management
  const [claimState, setClaimState] = useState<ClaimState>({
    stage: ClaimStage.IDLE,
    ticket: null,
    error: null,
    claimTimestamp: null
  });

  const [, dispatch] = useAtom(ticketActionsAtom);

  /**
   * Processes the complete claim sequence
   */
  const claimPrize = useCallback(async (ticketId: string, prizeId: string) => {
    try {
      // Begin claim sequence
      setClaimState(prev => ({
        ...prev,
        stage: ClaimStage.VALIDATING,
        error: null
      }));
      onClaimStart?.();

      // Validate claim eligibility
      setClaimState(prev => ({
        ...prev,
        stage: ClaimStage.PROCESSING
      }));
      onValidated?.();

      // Process the claim
      const response = await ticketApi.claimPrize({
        ticketId,
        prizeId,
        claimMethod: 'CREDIT',
        acceptedTerms: true
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      const claimedTicket = (response.data as TicketResponse).ticket;

      // Process delivery phase
      setClaimState(prev => ({
        ...prev,
        stage: ClaimStage.DELIVERING,
        ticket: claimedTicket
      }));

      // Complete claim sequence
      setClaimState(prev => ({
        ...prev,
        stage: ClaimStage.COMPLETED,
        claimTimestamp: new Date().toISOString()
      }));
      onSuccess?.(claimedTicket);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Prize claim failed';
      
      setClaimState(prev => ({
        ...prev,
        stage: ClaimStage.FAILED,
        error: errorMessage
      }));
      
      onError?.(errorMessage);
    }
  }, [onClaimStart, onValidated, onSuccess, onError]);

  /**
   * Resets claim state for new attempt
   */
  const resetClaim = useCallback(() => {
    setClaimState({
      stage: ClaimStage.IDLE,
      ticket: null,
      error: null,
      claimTimestamp: null
    });
  }, []);

  /**
   * Compute active claiming state
   */
  const isClaiming = [
    ClaimStage.VALIDATING,
    ClaimStage.PROCESSING,
    ClaimStage.DELIVERING
  ].includes(claimState.stage);

  return {
    // State
    stage: claimState.stage,
    ticket: claimState.ticket,
    error: claimState.error,
    claimTimestamp: claimState.claimTimestamp,
    isClaiming,

    // Actions
    claimPrize,
    resetClaim
  };
}