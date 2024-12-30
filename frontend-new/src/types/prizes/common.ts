// src/types/prizes/common.ts

/**
 * Shared Prize Domain Types
 * Mirrors Python backend enums and shared types
 */

export type PrizeType = 'instant_win' | 'draw_win';
export type PrizeTier = 'platinum' | 'gold' | 'silver' | 'bronze';

/**
 * Distribution Types
 * Mirrors Python DrawWinDistributionType enum
 */
export type DrawWinDistributionType = 'SPLIT' | 'FULL';

/**
 * Value Structures
 * Maps to Python Decimal fields
 */
export interface PrizeValues {
    retail: number;
    cash: number;
    credit: number;
  }

/**
 * Prize Instance Status
 * Maps to Python InstanceStatus enum
 */
export type PrizeInstanceStatus = 
  | 'AVAILABLE'
  | 'DISCOVERED'
  | 'CLAIMED'
  | 'EXPIRED'
  | 'VOIDED';
  
/**
 * Core Template Structure
 * Maps to essential Python PrizeTemplate model attributes
 */
export interface PrizeTemplate {
    id: number;
    name: string;
    type: PrizeType;
    tier: PrizeTier;
    values: PrizeValues;
    total_instances: number;
    pools_count: number;
    instances_claimed: number;
    is_deleted: boolean;
    created_at: string;
    created_by_id: number;
    updated_at: string | null;
  }


  /**
 * Metadata Types
 * Supports UI representation
 */
export interface PrizeTypeMeta {
    label: string;
    icon: string;
    color: string;
    description: string;
  }

  export interface PrizeTierMeta {
    label: string;
    color: string;
    bgColor: string;
  }