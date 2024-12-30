// src/types/prizes/models.ts

/**
 * Core Prize Enums
 * Mirrors Python backend enums from prize_template.py and prize_instance.py
 */
export type PrizeType = 'instant_win' | 'draw_win';

export type PrizeTier = 'platinum' | 'gold' | 'silver' | 'bronze';

export type DrawWinDistributionType = 'SPLIT' | 'FULL';

/**
 * Base Value Types
 * Mirrors Python Decimal field structures
 */
export interface PrizeValues {
  retail: number;
  cash: number;
  credit: number;
}

/**
 * Prize Template Model
 * Exactly matches Python PrizeTemplate model attributes
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
 * API Request Payloads
 * Matches Flask route expectations
 */
export interface CreateTemplatePayload {
  name: string;
  type: PrizeType;
  tier: PrizeTier;
  retail_value: number;
  cash_value: number;
  credit_value: number;
}

export interface UpdateTemplatePayload {
  name?: string;
  tier?: PrizeTier;
  retail_value?: number;
  cash_value?: number;
  credit_value?: number;
}

/**
 * API Response Types
 * Matches Flask response structures
 */
export interface TemplateResponse {
  templates: PrizeTemplate[];
}

export interface SingleTemplateResponse {
  template: PrizeTemplate;
}

/**
 * Template Instance Types
 * Mirrors Python instance models
 */
export interface BasePrizeInstance {
  id: number;
  instance_id: string;
  pool_id: number;
  template_id: number;
  status: PrizeInstanceStatus;
  values: PrizeValues;
  created_at: string;
  created_by_id: number;
  instance_type: 'instant_win' | 'draw_win';
  discovering_ticket_id?: string;
  discovery_time?: string;
  claimed_at?: string;
  claimed_by_id?: number;
  claim_transaction_id?: number;
  claim_meta?: Record<string, any>;
}

export interface InstantWinInstance extends BasePrizeInstance {
  instance_type: 'instant_win';
  individual_odds: number;
  collective_odds: number;
}

export interface DrawWinInstance extends BasePrizeInstance {
  instance_type: 'draw_win';
  distribution_type: DrawWinDistributionType;
}

/**
 * Instance Status Types
 * Mirrors Python InstanceStatus enum
 */
export type PrizeInstanceStatus = 
  | 'AVAILABLE'
  | 'DISCOVERED'
  | 'CLAIMED'
  | 'EXPIRED'
  | 'VOIDED';

/**
 * Validation Utilities
 * Implements Python validation rules
 */
export function validateTemplate(data: Partial<CreateTemplatePayload>): string[] {
  const errors: string[] = [];

  // Name validation
  if (!data.name?.trim()) {
    errors.push('Template name is required');
  } else if (data.name.length < 3 || data.name.length > 100) {
    errors.push('Template name must be between 3 and 100 characters');
  }

  // Value validations
  if (data.retail_value != null && data.retail_value < 0) {
    errors.push('Retail value must be positive');
  }
  if (data.cash_value != null && data.cash_value < 0) {
    errors.push('Cash value must be positive');
  }
  if (data.credit_value != null && data.credit_value < 0) {
    errors.push('Credit value must be positive');
  }

  return errors;
}

/**
 * UI Metadata
 * Supports consistent UI representation
 */
export const PRIZE_TYPE_META: Record<PrizeType, {
  label: string;
  icon: string;
  color: string;
  description: string;
}> = {
  instant_win: {
    label: 'Instant Win',
    icon: 'zap',
    color: 'text-amber-500',
    description: 'Instantly revealed prizes with specific odds'
  },
  draw_win: {
    label: 'Draw Win',
    icon: 'trophy',
    color: 'text-purple-500',
    description: 'Prizes awarded through scheduled draws'
  }
};

export const PRIZE_TIER_META: Record<PrizeTier, {
  label: string;
  color: string;
  bgColor: string;
}> = {
  platinum: {
    label: 'Platinum',
    color: 'text-gray-900',
    bgColor: 'bg-gray-100'
  },
  gold: {
    label: 'Gold',
    color: 'text-yellow-800',
    bgColor: 'bg-yellow-100'
  },
  silver: {
    label: 'Silver',
    color: 'text-gray-700',
    bgColor: 'bg-gray-100'
  },
  bronze: {
    label: 'Bronze',
    color: 'text-orange-800',
    bgColor: 'bg-orange-100'
  }
};