/**
 * Ticket Groups Store
 * 
 * Manages ticket group state with optimized caching patterns.
 * Integrates with existing ticket management system while
 * maintaining separation of concerns.
 */

import { atom } from 'jotai';
import { atomWithStorage } from 'jotai/utils';
import type { TicketGroup } from '../api/types/ticketGroups';

// Cache invalidation threshold
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

interface TicketGroupsState {
  groups: TicketGroup[];
  lastUpdated: string | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: TicketGroupsState = {
  groups: [],
  lastUpdated: null,
  isLoading: false,
  error: null
};

// Persistent cache atom
export const ticketGroupsCacheAtom = atomWithStorage<{
  data: TicketGroup[] | null;
  timestamp: string | null;
}>('ticket_groups_cache', {
  data: null,
  timestamp: null
});

// Runtime state atom
export const ticketGroupsStateAtom = atom<TicketGroupsState>(initialState);

// Computed atom for cache status
export const isCacheValidAtom = atom((get) => {
  const cache = get(ticketGroupsCacheAtom);
  if (!cache.timestamp) return false;
  
  const cacheAge = Date.now() - new Date(cache.timestamp).getTime();
  return cacheAge < CACHE_DURATION;
});

// Action atoms
export const setGroupsAtom = atom(
  null,
  (get, set, groups: TicketGroup[]) => {
    const timestamp = new Date().toISOString();
    
    // Update runtime state
    set(ticketGroupsStateAtom, {
      groups,
      lastUpdated: timestamp,
      isLoading: false,
      error: null
    });

    // Update cache
    set(ticketGroupsCacheAtom, {
      data: groups,
      timestamp
    });
  }
);

export const setLoadingAtom = atom(
  null,
  (get, set, isLoading: boolean) => {
    set(ticketGroupsStateAtom, prev => ({
      ...prev,
      isLoading,
      error: null
    }));
  }
);

export const setErrorAtom = atom(
  null,
  (get, set, error: string) => {
    set(ticketGroupsStateAtom, prev => ({
      ...prev,
      error,
      isLoading: false
    }));
  }
);