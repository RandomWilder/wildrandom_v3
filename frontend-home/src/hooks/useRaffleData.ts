// src/hooks/useRaffleData.ts

import { useCallback, useState, useMemo } from 'react';
import { AxiosError } from 'axios';
import { raffleAPI } from '../api/endpoints';
import { useCachedData } from './useCachedData';
import type { Raffle } from '../api/types';
import { isApiError } from '../api/types';

interface UseRaffleDataParams {
  raffleId?: number;
}

interface UseRaffleDataReturn {
  raffle: Raffle | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export const useRaffleData = ({ 
  raffleId 
}: UseRaffleDataParams): UseRaffleDataReturn => {
  const [error, setError] = useState<string | null>(null);
  
  // Memoize cache key to prevent unnecessary hook re-runs
  const cacheKey = useMemo(() => 
    raffleId ? `raffle-${raffleId}` : '', 
    [raffleId]
  );

  // Memoize fetcher function
  const fetchRaffle = useCallback(async () => {
    if (!raffleId || isNaN(raffleId)) {
      throw new Error('Invalid raffle ID');
    }

    try {
      const response = await raffleAPI.getRaffle(raffleId);

      if (isApiError(response)) {
        throw new Error(response.error);
      }

      return response;
    } catch (err) {
      const errorMessage = err instanceof AxiosError 
        ? err.response?.data?.error || err.message
        : err instanceof Error 
          ? err.message 
          : 'Failed to fetch raffle';
      
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [raffleId]);

  const { 
    data: raffle,
    isLoading,
    error: fetchError,
    mutate
  } = useCachedData<Raffle>({
    key: cacheKey,
    fetcher: fetchRaffle,
    revalidateOnMount: true,
    revalidateOnFocus: false,
    onError: (error: Error) => {
      setError(error.message);
    }
  });

  const refetch = useCallback(async () => {
    try {
      await mutate();
      setError(null);
    } catch (err) {
      // Error handling is already managed by the cache hook
    }
  }, [mutate]);

  return {
    raffle: raffle || null,
    isLoading,
    error: error || (fetchError?.message ?? null),
    refetch
  };
};

export default useRaffleData;