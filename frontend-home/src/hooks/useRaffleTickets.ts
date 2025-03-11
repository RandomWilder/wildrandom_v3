import { useState, useCallback, useEffect } from 'react';
import axiosInstance from '../api/client';

// Type definitions for ticket data
export interface Prize {
  instance_id: string;
  name: string;
  value: number;
  type: 'cash' | 'physical' | 'digital';
}

export interface Ticket {
  id: number;
  ticket_id: string;
  ticket_number: string;
  raffle_id: number;
  user_id: number;
  status: 'sold' | 'revealed' | 'discovered' | 'claimed';
  instant_win_eligible: boolean;
  is_revealed: boolean;
  reveal_time: string | null;
  reveal_sequence: number | null;
  purchase_time: string;
  transaction_id: number;
  created_at: string;
  prize?: Prize;
}

interface UseRaffleTicketsProps {
  raffleId: number | string;
}

/**
 * Hook for managing tickets for a specific raffle
 * 
 * Provides functionality to:
 * - Fetch tickets for a specific raffle
 * - Handle ticket operations (reveal, discover, claim)
 * - Track loading and error states
 */
export function useRaffleTickets({ raffleId }: UseRaffleTicketsProps) {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [processingTickets, setProcessingTickets] = useState<Record<string, boolean>>({});
  
  const parsedRaffleId = typeof raffleId === 'string' ? parseInt(raffleId, 10) : raffleId;
  
  // Fetch tickets for the specified raffle
  const fetchTickets = useCallback(async () => {
    // Skip if raffleId is invalid
    if (!parsedRaffleId || isNaN(parsedRaffleId)) {
      setError('Invalid raffle ID');
      return;
    }
    
    try {
      setIsLoading(true);
      setError(null);
      
      // Make request to the raffle-specific tickets endpoint
      const response = await axiosInstance.get(`/api/raffles/${parsedRaffleId}/tickets`);
      
      // Verify the response shape
      if (Array.isArray(response.data)) {
        setTickets(response.data);
      } else {
        console.error('Unexpected response format:', response.data);
        setTickets([]);
        setError('Received invalid data format from server');
      }
    } catch (err) {
      console.error(`Error fetching tickets for raffle ${parsedRaffleId}:`, err);
      setError(err instanceof Error ? err.message : 'Failed to load tickets');
    } finally {
      setIsLoading(false);
    }
  }, [parsedRaffleId]);
  
  // Reveal a ticket
  const revealTicket = useCallback(async (ticketId: string) => {
    try {
      setProcessingTickets(prev => ({ ...prev, [ticketId]: true }));
      
      const response = await axiosInstance.post(`/api/raffles/${parsedRaffleId}/tickets/reveal`, {
        ticket_ids: [ticketId]
      });
      
      if (response.data && Array.isArray(response.data) && response.data.length > 0) {
        // Update tickets with the revealed data
        setTickets(prevTickets => 
          prevTickets.map(ticket => {
            const revealedTicket = response.data.find((t: Ticket) => t.ticket_id === ticket.ticket_id);
            return revealedTicket ? { ...ticket, ...revealedTicket } : ticket;
          })
        );
        return response.data[0];
      }
      return null;
    } catch (err) {
      console.error(`Error revealing ticket ${ticketId}:`, err);
      throw err;
    } finally {
      setProcessingTickets(prev => ({ ...prev, [ticketId]: false }));
    }
  }, [parsedRaffleId]);
  
  // Discover prize for a revealed ticket
  const discoverPrize = useCallback(async (ticketId: string) => {
    try {
      setProcessingTickets(prev => ({ ...prev, [ticketId]: true }));
      
      const response = await axiosInstance.post(`/api/raffles/${parsedRaffleId}/tickets/${ticketId}/discover`);
      
      if (response.data && response.data.prize) {
        // Update the ticket with prize information
        setTickets(prevTickets => 
          prevTickets.map(ticket => 
            ticket.ticket_id === ticketId 
              ? { 
                  ...ticket, 
                  status: 'discovered', 
                  prize: response.data.prize 
                } 
              : ticket
          )
        );
        return response.data;
      }
      return null;
    } catch (err) {
      console.error(`Error discovering prize for ticket ${ticketId}:`, err);
      throw err;
    } finally {
      setProcessingTickets(prev => ({ ...prev, [ticketId]: false }));
    }
  }, [parsedRaffleId]);
  
  // Claim a discovered prize
  const claimPrize = useCallback(async (prizeInstanceId: string, claimType: 'credit' | 'cash' | 'retail') => {
    try {
      const ticketId = tickets.find(t => t.prize?.instance_id === prizeInstanceId)?.ticket_id;
      
      if (ticketId) {
        setProcessingTickets(prev => ({ ...prev, [ticketId]: true }));
      }
      
      const response = await axiosInstance.post('/api/payments/process-prize-claim', {
        prize_instance_id: prizeInstanceId,
        claim_type: claimType
      });
      
      if (response.data && response.data.transaction) {
        // Update the ticket status to claimed
        if (ticketId) {
          setTickets(prevTickets => 
            prevTickets.map(ticket => 
              ticket.ticket_id === ticketId 
                ? { ...ticket, status: 'claimed' } 
                : ticket
            )
          );
        }
        return response.data;
      }
      return null;
    } catch (err) {
      console.error(`Error claiming prize ${prizeInstanceId}:`, err);
      throw err;
    } finally {
      const ticketId = tickets.find(t => t.prize?.instance_id === prizeInstanceId)?.ticket_id;
      if (ticketId) {
        setProcessingTickets(prev => ({ ...prev, [ticketId]: false }));
      }
    }
  }, [tickets]);
  
  // Fetch tickets on component mount or raffleId change
  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);
  
  return {
    tickets,
    isLoading,
    error,
    processingTickets,
    fetchTickets,
    revealTicket,
    discoverPrize,
    claimPrize
  };
}

export default useRaffleTickets;