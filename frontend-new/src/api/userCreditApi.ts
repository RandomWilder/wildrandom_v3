import { api } from '@/lib/api-client';
import { AxiosError } from 'axios';
import type {
  CreditTransaction,
  TransactionType,
  CreateTransactionPayload,
  TransactionResponse,
  TransactionFilter,
  UserBalance,
  BalanceResponse,
  TransactionSummary
} from '@/types/users';

/**
 * API Route Configuration
 * Mirrors Flask blueprint structure with focus on credit management
 */
const ROUTES = {
  admin: {
    base: '/api/admin/users/credits',
    transactions: '/api/admin/users/credits/transactions',
    userTransactions: (userId: number) => `/api/admin/users/${userId}/credits/transactions`,
    balance: (userId: number) => `/api/admin/users/${userId}/credits/balance`,
    adjust: (userId: number) => `/api/admin/users/${userId}/credits/adjust`,
    summary: '/api/admin/users/credits/summary',
    validate: '/api/admin/users/credits/validate'
  }
} as const;

/**
 * Error Handler Function
 * Specialized for credit-related operations
 */
const handleApiError = (error: unknown): Error => {
  if (error instanceof AxiosError) {
    // Handle structured API errors
    if (error.response?.data?.message) {
      return new Error(error.response.data.message);
    }

    // Handle credit-specific error cases
    switch (error.response?.status) {
      case 400:
        return new Error('Invalid transaction data provided.');
      case 401:
        return new Error('Authentication required for credit operations.');
      case 403:
        return new Error('Insufficient permissions for credit management.');
      case 404:
        return new Error('User or transaction not found.');
      case 409:
        return new Error('Insufficient credits for this operation.');
      case 422:
        return new Error('Invalid credit amount or transaction type.');
      default:
        return new Error('Failed to process credit operation.');
    }
  }

  return error instanceof Error ? error : new Error('An unknown error occurred');
};

/**
 * Credit Management API Service
 * Implements comprehensive credit transaction functionality for admin operations
 */
export const userCreditApi = {
  /**
   * List All Transactions
   */
  async listTransactions(filters?: TransactionFilter): Promise<TransactionResponse> {
    try {
      const queryParams = new URLSearchParams();
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined) {
            queryParams.append(key, String(value));
          }
        });
      }
      
      return await api.get<TransactionResponse>(
        `${ROUTES.admin.transactions}?${queryParams.toString()}`
      );
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * Get User's Transactions
   */
  async getUserTransactions(userId: number, filters?: TransactionFilter): Promise<TransactionResponse> {
    try {
      const queryParams = new URLSearchParams();
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined) {
            queryParams.append(key, String(value));
          }
        });
      }
      
      return await api.get<TransactionResponse>(
        `${ROUTES.admin.userTransactions(userId)}?${queryParams.toString()}`
      );
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * Get User's Current Balance
   */
  async getUserBalance(userId: number): Promise<UserBalance> {
    try {
      const response = await api.get<BalanceResponse>(ROUTES.admin.balance(userId));
      return response.balance;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * Create Administrative Credit Adjustment
   */
  async adjustCredits(
    userId: number,
    amount: number,
    notes: string
  ): Promise<CreditTransaction> {
    try {
      const payload: CreateTransactionPayload = {
        user_id: userId,
        amount,
        transaction_type: 'admin_adjustment',
        notes
      };

      return await api.post<CreditTransaction>(
        ROUTES.admin.adjust(userId),
        payload
      );
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * Get Transaction Summary
   */
  async getTransactionSummary(
    startDate?: string,
    endDate?: string
  ): Promise<TransactionSummary> {
    try {
      const queryParams = new URLSearchParams();
      if (startDate) queryParams.append('start_date', startDate);
      if (endDate) queryParams.append('end_date', endDate);
      
      return await api.get<TransactionSummary>(
        `${ROUTES.admin.summary}?${queryParams.toString()}`
      );
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * Validate Transaction Amount
   */
  async validateTransaction(
    userId: number,
    amount: number,
    type: TransactionType
  ): Promise<{ valid: boolean; message?: string }> {
    try {
      const response = await api.post<{ valid: boolean; message?: string }>(
        ROUTES.admin.validate,
        { user_id: userId, amount, transaction_type: type }
      );
      return response;
    } catch (error) {
      throw handleApiError(error);
    }
  }
};