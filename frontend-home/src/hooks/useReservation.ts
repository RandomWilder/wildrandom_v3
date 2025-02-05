// src/hooks/useReservation.ts

import { useState, useCallback, useEffect } from 'react';
import { useAtom } from 'jotai';
import { 
  reservationStateAtom, 
  clearReservationAtom,
  isReservationActiveAtom 
} from '../stores/reservation';
import type { Raffle } from '../api/types';

interface UseReservationOptions {
  raffle: Raffle;
  onSuccess?: () => void;
  onError?: (error: string) => void;
  onExpired?: () => void;
}

interface UseReservationReturn {
  isModalOpen: boolean;
  openModal: () => void;
  closeModal: () => void;
  isLoading: boolean;
  error: string | null;
  hasActiveReservation: boolean;
  handleReservationComplete: () => void;
  handleExpiry: () => void;
}

/**
 * useReservation Hook
 * 
 * Manages the reservation lifecycle with proper state management,
 * expiry handling, and error propagation.
 * 
 * @param options Configuration options for reservation management
 * @returns Interface for controlling reservation flow
 * 
 * @example
 * ```tsx
 * const { 
 *   isModalOpen, 
 *   openModal,
 *   hasActiveReservation 
 * } = useReservation({
 *   raffle,
 *   onSuccess: () => navigate('/purchase'),
 *   onError: (error) => setErrorMessage(error),
 *   onExpired: () => showExpiredNotification()
 * });
 * ```
 */
export function useReservation({
  raffle,
  onSuccess,
  onError,
  onExpired
}: UseReservationOptions): UseReservationReturn {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [state] = useAtom(reservationStateAtom);
  const [hasActiveReservation] = useAtom(isReservationActiveAtom);
  const [, clearReservation] = useAtom(clearReservationAtom);

  // Monitor raffle state changes
  useEffect(() => {
    if (raffle.state !== 'open' && hasActiveReservation) {
      clearReservation();
      onError?.('Raffle is no longer available for reservations');
    }
  }, [raffle.state, hasActiveReservation, clearReservation, onError]);

  // Modal Controls
  const openModal = useCallback(() => {
    if (!raffle.available_tickets) {
      onError?.('No tickets available for reservation');
      return;
    }
    setIsModalOpen(true);
  }, [raffle.available_tickets, onError]);

  const closeModal = useCallback(() => {
    setIsModalOpen(false);
    if (!hasActiveReservation) {
      clearReservation();
    }
  }, [hasActiveReservation, clearReservation]);

  // Reservation Complete Handler
  const handleReservationComplete = useCallback(() => {
    closeModal();
    onSuccess?.();
  }, [closeModal, onSuccess]);

  // Expiry Handler
  const handleExpiry = useCallback(() => {
    clearReservation();
    onExpired?.();
    // Optionally show error message
    onError?.('Reservation has expired');
  }, [clearReservation, onExpired, onError]);

  // Auto-cleanup on unmount
  useEffect(() => {
    return () => {
      if (!hasActiveReservation) {
        clearReservation();
      }
    };
  }, [hasActiveReservation, clearReservation]);

  return {
    isModalOpen,
    openModal,
    closeModal,
    isLoading: state.isLoading,
    error: state.error,
    hasActiveReservation,
    handleReservationComplete,
    handleExpiry
  };
}

export default useReservation;