import { Ticket as ApiTicket, Prize as ApiPrize } from '../hooks/useRaffleTickets';

/**
 * Type definitions aligned with TicketGridComponent's expected structure
 */
export type TicketStatus = 'unrevealed' | 'revealed' | 'discovered' | 'claimed';

export interface ComponentPrize {
  name: string;
  value: number;
  type: 'cash' | 'physical' | 'digital';
}

export interface TicketData {
  id: string;
  ticketNumber: string;
  raffleId: number;
  status: TicketStatus;
  isInstantWin: boolean;
  isDrawWinner: boolean;
  purchaseDate: string;
  revealDate?: string;
  prize?: ComponentPrize;
}

/**
 * Maps API status values to component-expected status values
 */
const statusMap: Record<string, TicketStatus> = {
  'sold': 'unrevealed',
  'revealed': 'revealed',
  'discovered': 'discovered',
  'claimed': 'claimed'
};

/**
 * Converts API ticket format to the format expected by TicketGridComponent
 */
export function adaptTicket(apiTicket: ApiTicket): TicketData {
  return {
    id: apiTicket.ticket_id,
    ticketNumber: apiTicket.ticket_number,
    raffleId: apiTicket.raffle_id,
    status: statusMap[apiTicket.status] || 'unrevealed',
    isInstantWin: apiTicket.instant_win_eligible,
    isDrawWinner: false,
    purchaseDate: apiTicket.purchase_time,
    revealDate: apiTicket.reveal_time || undefined,
    prize: apiTicket.prize ? {
      name: apiTicket.prize.name,
      value: apiTicket.prize.value,
      type: apiTicket.prize.type as 'cash' | 'physical' | 'digital'
    } : undefined
  };
}

/**
 * Converts an array of API tickets to the format expected by TicketGridComponent
 */
export function adaptTickets(apiTickets: ApiTicket[]): TicketData[] {
  return apiTickets.map(adaptTicket);
}

export function adaptTicketForGridComponent(apiTicket: any, raffleTitle: string = '') {
    return {
      id: apiTicket.ticket_id,
      ticket_id: apiTicket.ticket_id,
      ticket_number: apiTicket.ticket_number,
      raffle_id: apiTicket.raffle_id,
      user_id: apiTicket.user_id,
      status: apiTicket.status,
      is_revealed: apiTicket.is_revealed,
      instant_win_eligible: apiTicket.instant_win_eligible,
      purchase_time: apiTicket.purchase_time,
      reveal_time: apiTicket.reveal_time,
      reveal_sequence: apiTicket.reveal_sequence,
      transaction_id: apiTicket.transaction_id,
      created_at: apiTicket.created_at,
      discovered_prize: apiTicket.discovered_prize,
      claim_status: apiTicket.claim_status || null,
      raffle_title: raffleTitle  // Add this property
    };
}

  