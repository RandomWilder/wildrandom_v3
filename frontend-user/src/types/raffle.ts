// src/types/raffle.ts
export interface PrizePoolSummary {
    total_instances: number;
    available_instances: {
      instant_win: number;
      draw_win: number;
    };
    total_value: {
      retail: number;
      cash: number;
      credit: number;
    };
  }
  
  export interface TimeRemaining {
    seconds_to_start: number;
    seconds_to_end: number;
    formatted_time_to_start: string;
    formatted_time_to_end: string;
  }
  
  export interface Raffle {
    id: number;
    title: string;
    description?: string;
    prize_pool_id: number;
    total_tickets: number;
    ticket_price: number;
    max_tickets_per_user: number;
    start_time: string;
    end_time: string;
    status: 'active' | 'inactive' | 'cancelled';
    state: 'draft' | 'coming_soon' | 'open' | 'paused' | 'ended';
    is_visible: boolean;
    time_remaining: TimeRemaining;
    prize_pool_summary?: PrizePoolSummary;
  }