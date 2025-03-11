import { useState, useEffect, useCallback } from 'react';
import axiosInstance from '../api/client';

export interface RaffleDetails {
  id: number;
  title: string;
  description: string;
  start_date: string;
  end_date: string;
  status: 'draft' | 'pending' | 'open' | 'closed' | 'completed';
  image_url?: string;
  prize_pool_value: number;
  total_tickets: number;
  sold_tickets: number;
  instant_win_odds?: number;
  draw_date?: string;
}

/**
 * Hook for fetching and managing raffle details
 * 
 * @param raffleId - The ID of the raffle to fetch details for
 */
export function useRaffleDetails(raffleId?: number | string) {
  const [raffleDetails, setRaffleDetails] = useState<RaffleDetails | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  const parsedRaffleId = typeof raffleId === 'string' ? parseInt(raffleId, 10) : raffleId;
  
  const fetchRaffleDetails = useCallback(async () => {
    // Skip if raffleId is invalid
    if (!parsedRaffleId || isNaN(parsedRaffleId)) {
      setError('Invalid raffle ID');
      return;
    }
    
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await axiosInstance.get(`/api/raffles/${parsedRaffleId}`);
      
      if (response.data) {
        setRaffleDetails(response.data);
      } else {
        setError('No raffle data found');
      }
    } catch (err) {
      console.error(`Error fetching raffle details for raffle ${parsedRaffleId}:`, err);
      setError(err instanceof Error ? err.message : 'Failed to load raffle details');
    } finally {
      setIsLoading(false);
    }
  }, [parsedRaffleId]);
  
  // Fetch raffle details on component mount or raffleId change
  useEffect(() => {
    fetchRaffleDetails();
  }, [fetchRaffleDetails]);
  
  return {
    raffleDetails,
    isLoading,
    error,
    fetchRaffleDetails
  };
}

export default useRaffleDetails;