// src/hooks/useBalanceAdjustmentApi.ts
import { useState } from 'react';
import { api } from '@/lib/api-client';
import { AxiosError } from 'axios';

interface BalanceAdjustmentPayload {
  user_id: number;
  amount: number;
  is_credit: boolean;
  reason: string;
}

interface BalanceAdjustmentResponse {
  transaction_id: number;
  user_id: number;
  amount: number;
  type: string;
  status: string;
  created_at: string;
  new_balance: number;
}

export function useBalanceAdjustmentApi() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const adjustBalance = async (payload: BalanceAdjustmentPayload): Promise<BalanceAdjustmentResponse> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await api.post<BalanceAdjustmentResponse>(
        '/api/admin/payments/adjust-balance', 
        payload
      );
      
      return response;
    } catch (err) {
      let errorMessage = 'Failed to adjust balance';
      
      if (err instanceof AxiosError) {
        if (err.response?.data?.message) {
          errorMessage = err.response.data.message;
        } else if (err.response?.status === 400) {
          errorMessage = 'Invalid adjustment data provided';
        } else if (err.response?.status === 401) {
          errorMessage = 'Authentication required';
        } else if (err.response?.status === 403) {
          errorMessage = 'Insufficient permissions for this operation';
        }
      }
      
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    adjustBalance,
    isLoading,
    error
  };
}