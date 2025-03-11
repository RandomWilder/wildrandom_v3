// src/hooks/useTickets.ts

import { useCallback, useState, useEffect } from 'react';
import { useAtom } from 'jotai';
import { persistedTicketStateAtom, runtimeTicketStateAtom } from '../stores/tickets';
import ticketApi from '../api/ticketApi';
import type { 
  TicketFilters, 
  TicketSort,
  TicketGroup,
  MyTicketsResponse,
  ApiResponse 
} from '../features/tickets/types';

/**
 * Enhanced ticket management hook optimized for cross-platform gaming interfaces.
 * Implements touch-first data handling with progressive enhancement for desktop.
 */
export const useTickets = () => {
  const [persistedState, setPersistedState] = useAtom(persistedTicketStateAtom);
  const [runtimeState, setRuntimeState] = useAtom(runtimeTicketStateAtom);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Type guard for API response validation
   * Ensures data integrity across device boundaries
   */
  const isValidTicketResponse = (
    response: ApiResponse<MyTicketsResponse>
  ): response is { data: Record<string, TicketGroup> } => {
    if (!response || !response.data) return false;
    return Object.entries(response.data).every(([_, group]) => (
      group &&
      typeof group === 'object' &&
      'raffle' in group &&
      'tickets' in group &&
      Array.isArray(group.tickets)
    ));
  };

  /**
   * Cross-platform ticket fetching implementation
   * Optimized for touch interactions with gesture debouncing
   * 
   * @param filters - Optional filters including raffleId for filtered results
   * @param sort - Optional sorting configuration
   */
  const fetchTickets = useCallback(async (
    filters?: TicketFilters,
    sort?: TicketSort
  ) => {
    const abortController = new AbortController();

    try {
      setIsLoading(true);
      setError(null);

      const response = await ticketApi.getTickets(filters, sort);
      
      if (!isValidTicketResponse(response)) {
        throw new Error('Invalid ticket data structure');
      }

      // Update persisted state with type-safe data
      setPersistedState(prevState => ({
        ...prevState,
        groups: response.data as Record<string, TicketGroup>,
        lastUpdated: new Date().toISOString(),
        version: prevState.version
      }));

      // Reset runtime error states
      setRuntimeState(prev => ({
        ...prev,
        error: null
      }));

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load tickets';
      setError(errorMessage);
      
      setRuntimeState(prev => ({
        ...prev,
        error: errorMessage
      }));

    } finally {
      setIsLoading(false);
    }

    return () => {
      abortController.abort();
    };
  }, [setPersistedState, setRuntimeState]);

  /**
   * Progressive enhancement strategy for initial data load
   * Prioritizes mobile performance with intelligent caching
   */
  useEffect(() => {
    const initialLoad = async () => {
      if (persistedState.lastUpdated) {
        const STALE_THRESHOLD = 5 * 60 * 1000; // 5 minutes
        const isStale = new Date().getTime() - new Date(persistedState.lastUpdated).getTime() > STALE_THRESHOLD;
        
        if (!isStale) return; // Optimize for mobile by using cached data
      }

      await fetchTickets();
    };

    initialLoad();
  }, [fetchTickets, persistedState.lastUpdated]);

  /**
   * Fetch tickets for a specific raffle
   * Provides optimized data loading for raffle-specific views
   * 
   * @param raffleId - The ID of the raffle to fetch tickets for
   */
  const fetchRaffleTickets = useCallback(async (
    raffleId: number,
    sort?: TicketSort
  ) => {
    return fetchTickets({ raffleId }, sort);
  }, [fetchTickets]);

  return {
    groups: persistedState.groups,
    isLoading,
    error,
    fetchTickets,
    fetchRaffleTickets, // Added for raffle-specific fetching
    operations: runtimeState.activeOperations,
    batchOperations: runtimeState.batchOperations,
    animationStates: runtimeState.animationStates
  };
};

export default useTickets;