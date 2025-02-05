import { atom } from 'jotai';
import { atomWithStorage } from 'jotai/utils';
import type { SiteCreditBalance } from '../features/payment/types';

/**
 * Balance State Management
 * 
 * Implements reactive balance state management with the following features:
 * - Real-time balance updates with optimistic mutations 
 * - Persistent cache with TTL for offline scenarios
 * - Type-safe state transitions and updates
 * - Integration with payment service events
 */

// #region Type Definitions
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

// #region Constants
const CACHE_TTL = 30000; // 30 seconds cache validity

// #region Initial States
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

// #region Core State Atoms
export const balanceStateAtom = atom<BalanceState>(initialState);

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

// #region Computed Atoms
export const availableBalanceAtom = atom<number>((get) => {
  const state = get(balanceStateAtom);
  return state.data?.available_amount ?? 0;
});

export const isBalanceStaleAtom = atom<boolean>((get) => {
  const cache = get(balanceCacheAtom);
  return Date.now() - cache.timestamp > CACHE_TTL;
});

// #region Action Atoms
export const balanceActionsAtom = atom(
  null,
  (_get, set, action: {
    type: 'SET_LOADING' | 'SET_ERROR' | 'UPDATE_BALANCE' | 'RESET';
    payload?: any;
  }) => {
    switch (action.type) {
      case 'SET_LOADING':
        set(balanceStateAtom, (state) => ({
          ...state,
          isLoading: true,
          error: null
        }));
        break;

      case 'SET_ERROR':
        set(balanceStateAtom, (state) => ({
          ...state,
          isLoading: false,
          error: action.payload
        }));
        break;

      case 'UPDATE_BALANCE':
        const balance = action.payload as SiteCreditBalance;
        set(balanceStateAtom, () => ({
          data: balance,
          lastUpdated: new Date().toISOString(),
          isLoading: false,
          error: null
        }));
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

export type { BalanceState, BalanceCache };