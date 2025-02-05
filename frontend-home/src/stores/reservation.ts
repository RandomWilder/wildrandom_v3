// src/stores/reservation.ts

import { atom } from 'jotai';
import { atomWithStorage } from 'jotai/utils';
import type { 
  ReservationState, 
  TicketReservation
} from '../api/types/reservation';

/**
 * Reservation Store
 * 
 * Manages the complete reservation lifecycle with proper state tracking,
 * persistence, and expiry handling. Implements atomic state updates with
 * comprehensive type safety.
 * 
 * State Flow:
 * 1. Initial -> Loading -> Active/Error
 * 2. Active -> Expired/Completed/Cancelled
 * 
 * @module stores/reservation
 */

/**
 * Initial reservation state configuration
 */
const initialState: ReservationState = {
  currentReservation: null,
  isLoading: false,
  error: null,
  expiryTimestamp: null
};

/**
 * Persistent storage interface for reservations
 */
interface ReservationStorage {
  reservation: TicketReservation | null;
  expiryTimestamp: number | null;
}

/**
 * Primary reservation state atom
 * Manages the core reservation state with comprehensive type safety
 */
export const reservationStateAtom = atom<ReservationState>(initialState);

/**
 * Persistent reservation storage with automatic expiry handling
 * Uses localStorage with proper type checking and validation
 */
export const reservationStorageAtom = atomWithStorage<ReservationStorage>(
  'wildrandom_reservation',
  {
    reservation: null,
    expiryTimestamp: null
  },
  {
    getItem: (key: string, initialValue: ReservationStorage): ReservationStorage => {
      const storedValue = localStorage.getItem(key);
      if (!storedValue) return initialValue;
      
      try {
        const parsed = JSON.parse(storedValue) as ReservationStorage;
        // Validate expiry
        if (parsed.expiryTimestamp && Date.now() > parsed.expiryTimestamp) {
          localStorage.removeItem(key);
          return initialValue;
        }
        return parsed;
      } catch {
        return initialValue;
      }
    },
    setItem: (key: string, value: ReservationStorage): void => {
      localStorage.setItem(key, JSON.stringify(value));
    },
    removeItem: (key: string): void => {
      localStorage.removeItem(key);
    }
  }
);

/**
 * Computed atom for reservation active status
 * Considers both reservation existence and expiry time
 */
export const isReservationActiveAtom = atom<boolean>((get) => {
  const state = get(reservationStateAtom);
  if (!state.currentReservation || !state.expiryTimestamp) return false;
  return Date.now() < state.expiryTimestamp;
});

/**
 * Computed atom for remaining reservation time
 * Returns time in seconds, with proper bounds checking
 */
export const reservationTimeRemainingAtom = atom<number>((get) => {
  const state = get(reservationStateAtom);
  if (!state.expiryTimestamp) return 0;
  return Math.max(0, Math.floor((state.expiryTimestamp - Date.now()) / 1000));
});

/**
 * Action atom for updating reservation state
 * Handles both state update and persistence with proper typing
 */
export const updateReservationAtom = atom(null, (_, set, reservation: TicketReservation) => {
  const expiryTimestamp = new Date(reservation.expires_at).getTime();
  
  // Update volatile state
  set(reservationStateAtom, {
    currentReservation: reservation,
    isLoading: false,
    error: null,
    expiryTimestamp
  });

  // Update persistent storage
  set(reservationStorageAtom, {
    reservation,
    expiryTimestamp
  });
});

/**
 * Action atom for clearing reservation state
 * Handles complete cleanup of both volatile and persistent state
 */
export const clearReservationAtom = atom(null, (_, set) => {
  set(reservationStateAtom, initialState);
  set(reservationStorageAtom, {
    reservation: null,
    expiryTimestamp: null
  });
});

/**
 * Action atom for handling reservation errors
 * Updates state while maintaining type safety
 */
export const setReservationErrorAtom = atom(null, (_, set, error: string) => {
  set(reservationStateAtom, prev => ({
    ...prev,
    error,
    isLoading: false
  }));
});