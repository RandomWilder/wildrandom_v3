export type TicketStatus = 'available' | 'reserved' | 'sold' | 'revealed' | 'expired' | 'void';

export interface Ticket {
  id: number;
  ticket_id: string;
  ticket_number: string;
  raffle_id: number;
  user_id?: number;
  status: TicketStatus;
  instant_win_eligible: boolean;
  is_revealed: boolean;
  reveal_time?: string;
  reveal_sequence?: number;
  purchase_time?: string;
  transaction_id?: number;
  created_at: string;
}

export interface TicketFilter {
  status?: TicketStatus;
  user_id?: number;
  revealed?: boolean;
  instant_win?: boolean;
  limit?: number;
}

export interface TicketResponse {
  tickets: Ticket[];
  total: number;
}

export const TICKET_STATUS_META: Record<TicketStatus, {
  label: string;
  color: string;
  bgColor: string;
  description: string;
}> = {
  available: {
    label: 'Available',
    color: 'text-blue-700',
    bgColor: 'bg-blue-50',
    description: 'Ticket is available for purchase'
  },
  reserved: {
    label: 'Reserved',
    color: 'text-yellow-700',
    bgColor: 'bg-yellow-50',
    description: 'Ticket is temporarily reserved'
  },
  sold: {
    label: 'Sold',
    color: 'text-green-700',
    bgColor: 'bg-green-50',
    description: 'Ticket has been purchased'
  },
  revealed: {
    label: 'Revealed',
    color: 'text-purple-700',
    bgColor: 'bg-purple-50',
    description: 'Ticket has been revealed by user'
  },
  expired: {
    label: 'Expired',
    color: 'text-gray-700',
    bgColor: 'bg-gray-50',
    description: 'Reservation has expired'
  },
  void: {
    label: 'Void',
    color: 'text-red-700',
    bgColor: 'bg-red-50',
    description: 'Ticket has been voided'
  }
};