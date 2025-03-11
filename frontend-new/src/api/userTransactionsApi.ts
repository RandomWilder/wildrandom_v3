// src/api/userTransactionsApi.ts
import { api } from '@/lib/api-client';
import { AxiosError } from 'axios';

// Transaction types
export type TransactionStatus = 'pending' | 'completed' | 'failed' | 'rolled_back';
export type TransactionReferenceType = 'ticket_purchase' | 'prize_claim' | 'refund' | 'adjustment';

export interface Transaction {
  id: number;
  user_id: number;
  type: string;
  amount: number;
  balance_after: number;
  status: TransactionStatus;
  reference_type: TransactionReferenceType;
  reference_id: string;
  meta_data?: {
    admin_id?: number;
    reason?: string;
    [key: string]: any;
  };
  created_at: string;
  completed_at?: string;
  credit_transaction_id?: number;
}

export interface TransactionsResponse {
  transactions: Transaction[];
  total: number;
  page: number;
  per_page: number;
  pages: number;
}

export interface TransactionFilter {
  page?: number;
  per_page?: number;
  status?: TransactionStatus;
  reference_type?: TransactionReferenceType;
  sort_by?: 'created_at' | 'amount' | 'status';
  sort_direction?: 'asc' | 'desc';
}

// API Route Configuration
const ROUTES = {
  admin: {
    userTransactions: (userId: number) => `/api/admin/payments/users/${userId}/transactions`
  }
};

// Error handler
const handleApiError = (error: unknown): Error => {
  if (error instanceof AxiosError) {
    // Handle HTTP status codes
    switch (error.response?.status) {
      case 401:
        return new Error('Authentication required for transaction history.');
      case 403:
        return new Error('Insufficient permissions to view transaction history.');
      case 404:
        return new Error('User not found.');
      default:
        return new Error(error.response?.data?.message || 'Failed to fetch transactions.');
    }
  }
  
  return error instanceof Error ? error : new Error('An unknown error occurred');
};

// Transactions API Service
export const userTransactionsApi = {
  /**
   * Get User Transactions
   */
  async getUserTransactions(userId: number, filters?: TransactionFilter): Promise<TransactionsResponse> {
    try {
      const queryParams = new URLSearchParams();
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined) {
            queryParams.append(key, String(value));
          }
        });
      }
      
      const response = await api.get<TransactionsResponse>(
        `${ROUTES.admin.userTransactions(userId)}?${queryParams.toString()}`
      );
      
      return response;
    } catch (error) {
      throw handleApiError(error);
    }
  }
};