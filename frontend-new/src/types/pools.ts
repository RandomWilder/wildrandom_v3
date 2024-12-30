// src/types/pools.ts

/**
 * Import types from prize domain
 * Reflects Python backend's domain model relationships
 */
import type { 
    PrizeTemplate,
    PrizeType,
    PrizeValues as BasePrizeValues,
    DrawWinDistributionType,
  } from './prizes/models';
  
  // Re-export for backward compatibility and domain completeness
  export type { 
    PrizeTemplate,
    DrawWinDistributionType 
  };
  
  /**
   * Core Status Types
   * Mirrors Python backend enums
   */
  export type PoolStatus = 'unlocked' | 'locked' | 'used';
  
  /**
   * Value Tracking
   * Extends base prize values for pool-specific needs
   */
  export interface PoolValues {
    retail_total: number;
    cash_total: number;
    credit_total: number;
  }
  
  /**
   * Template Allocation Types
   * Mirrors Python backend allocation models
   */
  export interface TemplateAllocation {
    template_id: number;
    quantity: number;
    collective_odds?: number;      // For instant win prizes
    distribution_type?: DrawWinDistributionType;    // For draw win prizes
  }
  
  export interface AllocatedInstance {
    instance_id: string;
    instance_type: 'instant_win' | 'draw_win';
    values: BasePrizeValues;
    individual_odds?: number;
    collective_odds?: number;
    distribution_type?: DrawWinDistributionType;
  }
  
  /**
   * API Response Types
   * Matches Flask backend response structures
   */
  export interface AllocationResponse {
    allocated_instances: AllocatedInstance[];
    pool_updated_totals: {
      total_instances: number;
      instant_win_instances: number;
      draw_win_instances: number;
      total_odds: number;
      values: PoolValues;
    };
  }
  
  export interface CreatePoolPayload {
    name: string;
    description?: string;
  }
  
  export interface PoolAllocation {
    id: number;
    pool_id: number;
    template: PrizeTemplate;
    quantity: number;
    collective_odds?: number;
    individual_odds?: number;
    distribution_type?: DrawWinDistributionType;
    created_at: string;
    updated_at: string | null;
  }
  
  /**
   * Core Prize Pool Model
   * Exactly matches Python PrizePool model attributes
   */
  export interface PrizePool {
    id: number;
    name: string;
    description: string | null;
    status: PoolStatus;
    total_instances: number;
    instant_win_instances: number;
    draw_win_instances: number;
    values: PoolValues;
    total_odds: number;
    locked_at: string | null;
    locked_by_id: number | null;
    created_at: string;
    created_by_id: number;
    current_raffle_id?: number;
    allocations?: PoolAllocation[];
  }
  
  /**
   * Metrics & Analytics
   * Supports business intelligence requirements
   */
  export interface PoolMetrics {
    totalPools: number;
    totalInstances: {
      total: number;
      instantWin: number;
      drawWin: number;
    };
    totalValues: PoolValues;
    statusCounts: Record<PoolStatus, number>;
  }
  
  /**
   * Validation Utilities
   * Implements Python backend validation rules
   */
  export function validateCreatePool(data: Partial<CreatePoolPayload>): string[] {
    const errors: string[] = [];
  
    if (!data.name?.trim()) {
      errors.push('Pool name is required');
    } else if (data.name.length < 3) {
      errors.push('Pool name must be at least 3 characters');
    } else if (data.name.length > 100) {
      errors.push('Pool name must not exceed 100 characters');
    }
  
    if (data.description && data.description.length > 500) {
      errors.push('Description must not exceed 500 characters');
    }
  
    return errors;
  }
  
  /**
   * UI Metadata
   * Supports consistent UI representation
   */
  export const POOL_STATUS_META: Record<PoolStatus, {
    label: string;
    color: string;
    bgColor: string;
    description: string;
  }> = {
    unlocked: {
      label: 'Unlocked',
      color: 'text-blue-700',
      bgColor: 'bg-blue-50',
      description: 'Pool is open for template allocation'
    },
    locked: {
      label: 'Locked',
      color: 'text-green-700',
      bgColor: 'bg-green-50',
      description: 'Pool is ready for raffle assignment'
    },
    used: {
      label: 'Used',
      color: 'text-gray-700',
      bgColor: 'bg-gray-50',
      description: 'Pool has been assigned to a raffle'
    }
  };