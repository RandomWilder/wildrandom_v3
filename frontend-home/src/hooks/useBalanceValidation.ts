/**
 * Balance Validation Hook
 * Manages balance verification with proper state management
 */

import { useCallback, useState } from 'react';
import { useAtom } from 'jotai';
import { sessionAtom } from '../stores/session';
import type { SiteCreditBalance } from '../features/payment/types';
import PaymentAPI from '../api/paymentApi';
import { isApiError } from '../api/types/common';

interface UseBalanceValidationResult {
  balance: SiteCreditBalance | null;
  isLoading: boolean;
  error: string | null;
  isValidating: boolean;
  validateBalance: (amount: number) => Promise<boolean>;
}

export function useBalanceValidation(): UseBalanceValidationResult {
  const [session, setSession] = useAtom(sessionAtom);
  const [isValidating, setIsValidating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validateBalance = useCallback(async (amount: number): Promise<boolean> => {
    if (!session.balance) return false;

    if (session.balance.available_amount >= amount) {
      return true;
    }

    try {
      setIsValidating(true);
      const response = await PaymentAPI.getBalance();
      
      if (isApiError(response)) {
        setError(response.error.message);
        return false;
      }

      if (response.data) {
        setSession(prev => ({
          ...prev,
          balance: response.data
        }));
        return response.data.available_amount >= amount;
      }

      return false;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to validate balance');
      return false;
    } finally {
      setIsValidating(false);
    }
  }, [session.balance, setSession]);

  return {
    balance: session.balance,
    isLoading: false,
    error,
    isValidating,
    validateBalance
  };
}