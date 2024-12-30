/**
 * Prize Pool Types
 * Defines interfaces for prize pool related functionality
 */

export interface PrizePoolValues {
    retail: number;
    cash: number;
    credit: number;
  }
  
  export interface PrizePoolSummary {
    total_instances: number;
    available_instances: {
      instant_win: number;
      draw_win: number;
    };
    total_value: PrizePoolValues;
  }
  
  export interface PrizePoolStatus {
    status: 'draft' | 'locked' | 'active' | 'completed';
    locked_at?: string;
    locked_by_id?: number;
  }
  
  export interface PrizePoolStats {
    total_instances: number;
    instant_win_instances: number;
    draw_win_instances: number;
    total_value: PrizePoolValues;
  }