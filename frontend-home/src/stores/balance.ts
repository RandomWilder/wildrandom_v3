/**
 * Balance Store Module
 * 
 * Implements atomic balance management with session integration, TTL-based cache,
 * and type-safe state transitions. Provides real-time balance synchronization
 * across components while maintaining proper error boundaries.
 */

import { atom } from 'jotai';
import { atomWithStorage } from 'jotai/utils';
import type { SiteCreditBalance } from '../api/types/payment';
import { sessionAtom } from './session';

// Type Definitions
interface BalanceState {
  data: SiteCreditBalance | null;
  lastUpdated: string | null;
  isLoading: boolean;
  error: string | null;
}

interface BalanceCache {
  data: SiteCreditBalance | null;
  timestamp: number;
}

// Constants
const CACHE_TTL = 30000; // 30 seconds cache validity
const STALE_THRESHOLD = 5 * 60 * 1000; // 5 minutes until balance considered stale

// Initial States
const initialState: BalanceState = {
  data: null,
  lastUpdated: null,
  isLoading: false,
  error: null
};

const initialCache: BalanceCache = {
  data: null,
  timestamp: 0
};

// Core Balance Atom
export const balanceStateAtom = atom<BalanceState>(initialState);

// Cached Balance Storage
export const balanceCacheAtom = atomWithStorage<BalanceCache>(
  'wildrandom_balance_cache',
  initialCache,
  {
    getItem: (key: string): BalanceCache => {
      const storedValue = localStorage.getItem(key);
      if (!storedValue) return initialCache;

      try {
        const cache = JSON.parse(storedValue) as BalanceCache;
        const isStale = Date.now() - cache.timestamp > CACHE_TTL;
        
        return isStale ? initialCache : cache;
      } catch {
        return initialCache;
      }
    },
    setItem: (key: string, value: BalanceCache): void => {
      localStorage.setItem(key, JSON.stringify({
        ...value,
        timestamp: Date.now()
      }));
    },
    removeItem: (key: string): void => {
      localStorage.removeItem(key);
    }
  }
);

// Computed Atoms
export const availableBalanceAtom = atom<number>((get) => {
  const state = get(balanceStateAtom);
  return state.data?.available_balance ?? 0;
});

export const isBalanceStaleAtom = atom<boolean>((get) => {
  const state = get(balanceStateAtom);
  if (!state.lastUpdated) return true;
  return Date.now() - new Date(state.lastUpdated).getTime() > STALE_THRESHOLD;
});

// Action Atoms for Balance Management
export const balanceActionsAtom = atom(
  null,
  (get, set, action: {
    type: 'SET_LOADING' | 'SET_ERROR' | 'UPDATE_BALANCE' | 'RESET';
    payload?: any;
  }) => {
    switch (action.type) {
      case 'SET_LOADING':
        set(balanceStateAtom, (prev) => ({
          ...prev,
          isLoading: true,
          error: null
        }));
        break;

      case 'SET_ERROR':
        set(balanceStateAtom, (prev) => ({
          ...prev,
          isLoading: false,
          error: action.payload
        }));
        break;

      case 'UPDATE_BALANCE':
        const balance = action.payload as SiteCreditBalance;
        const timestamp = new Date().toISOString();
        
        // Update balance state
        set(balanceStateAtom, {
          data: balance,
          lastUpdated: timestamp,
          isLoading: false,
          error: null
        });

        // Sync with session
        set(sessionAtom, (prev) => ({
          ...prev,
          balance,
          balanceLastUpdated: timestamp
        }));

        // Update cache
        set(balanceCacheAtom, {
          data: balance,
          timestamp: Date.now()
        });
        break;

      case 'RESET':
        set(balanceStateAtom, initialState);
        set(balanceCacheAtom, initialCache);
        break;
    }
  }
);

// Type Guards
export const isValidBalance = (balance: unknown): balance is SiteCreditBalance => {
  return (
    typeof balance === 'object' &&
    balance !== null &&
    'user_id' in balance &&
    'available_balance' in balance &&
    'pending_balance' in balance &&
    'last_updated' in balance
  );
};

// Utility Functions
export const balanceUtils = {
  isStale: (lastUpdated: string | null): boolean => {
    if (!lastUpdated) return true;
    return Date.now() - new Date(lastUpdated).getTime() > STALE_THRESHOLD;
  },

  formatBalance: (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  }
};

export type { BalanceState, BalanceCache };