/**
 * Credit Transaction Domain Types
 * Maps to Python backend credit_transaction.py model and related types
 */

/**
 * Transaction Types & Status
 */
export type TransactionType = 
  | 'credit_purchase'
  | 'prize_claim'
  | 'raffle_entry'
  | 'refund'
  | 'admin_adjustment'
  | 'loyalty_bonus';

/**
 * Core Transaction Model
 */
export interface CreditTransaction {
  id: number;
  user_id: number;
  amount: number;
  transaction_type: TransactionType;
  balance_after: number;
  reference_type?: string;
  reference_id?: string;
  notes?: string;
  created_at: string;
  created_by_id: number;
}

/**
 * Transaction Creation Payload
 */
export interface CreateTransactionPayload {
  user_id: number;
  amount: number;
  transaction_type: TransactionType;
  reference_type?: string;
  reference_id?: string;
  notes?: string;
}

/**
 * Balance Types
 */
export interface UserBalance {
  available_amount: number;
  pending_amount: number;
  last_updated: string;
}

/**
 * Transaction Filters
 */
export interface TransactionFilter {
  user_id?: number;
  transaction_type?: TransactionType;
  start_date?: string;
  end_date?: string;
  min_amount?: number;
  max_amount?: number;
}

/**
 * Response Types
 */
export interface TransactionResponse {
  transactions: CreditTransaction[];
  total: number;
  total_amount: number;
}

export interface BalanceResponse {
  balance: UserBalance;
}

/**
 * Transaction Summary
 */
export interface TransactionSummary {
  total_transactions: number;
  total_credits_purchased: number;
  total_credits_spent: number;
  transactions_by_type: Record<TransactionType, {
    count: number;
    total_amount: number;
  }>;
}

/**
 * UI Metadata
 */
export const TRANSACTION_TYPE_META: Record<TransactionType, {
  label: string;
  description: string;
  icon: string;
  color: string;
  bgColor: string;
}> = {
  credit_purchase: {
    label: 'Purchase',
    description: 'Credit purchase transaction',
    icon: 'credit-card',
    color: 'text-green-700',
    bgColor: 'bg-green-50'
  },
  prize_claim: {
    label: 'Prize Claim',
    description: 'Credits from claimed prize',
    icon: 'gift',
    color: 'text-purple-700',
    bgColor: 'bg-purple-50'
  },
  raffle_entry: {
    label: 'Raffle Entry',
    description: 'Credits spent on raffle tickets',
    icon: 'ticket',
    color: 'text-blue-700',
    bgColor: 'bg-blue-50'
  },
  refund: {
    label: 'Refund',
    description: 'Credit refund transaction',
    icon: 'rotate-ccw',
    color: 'text-yellow-700',
    bgColor: 'bg-yellow-50'
  },
  admin_adjustment: {
    label: 'Admin Adjustment',
    description: 'Manual adjustment by admin',
    icon: 'settings',
    color: 'text-gray-700',
    bgColor: 'bg-gray-50'
  },
  loyalty_bonus: {
    label: 'Loyalty Bonus',
    description: 'Loyalty program bonus credits',
    icon: 'award',
    color: 'text-amber-700',
    bgColor: 'bg-amber-50'
  }
};

/**
 * Validation
 */
export interface TransactionValidation {
  validateAmount: (amount: number) => boolean;
  validateBalance: (userId: number, amount: number) => Promise<boolean>;
}