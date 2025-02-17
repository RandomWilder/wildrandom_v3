// src/hooks/useBalanceSync.ts

import { useEffect, useCallback, useRef } from 'react';
import { useAtom } from 'jotai';
import { balanceStateAtom, balanceActionsAtom, isBalanceStaleAtom } from '../stores/balance';
import { sessionAtom } from '../stores/session';
import PaymentAPI from '../api/paymentApi';
import type { SiteCreditBalance } from '../api/types/payment';

interface UseBalanceSyncOptions {
  /** Refresh interval in milliseconds */
  refreshInterval?: number;
  /** Enable automatic refresh */
  autoRefresh?: boolean;
  /** Callback on successful balance update */
  onBalanceUpdate?: (balance: SiteCreditBalance) => void;
  /** Callback on balance sync error */
  onError?: (error: Error) => void;
}

/**
 * useBalanceSync Hook
 * 
 * Implements real-time balance synchronization with configurable refresh intervals
 * and proper cleanup. Integrates with the global balance management system while
 * maintaining type safety and proper error boundaries.
 * 
 * @param options Configuration options for balance synchronization
 * @returns Object containing sync status and manual refresh trigger
 */
export const useBalanceSync = ({
  refreshInterval = 30000,
  autoRefresh = true,
  onBalanceUpdate,
  onError
}: UseBalanceSyncOptions = {}) => {
  const [balanceState] = useAtom(balanceStateAtom);
  const [, dispatch] = useAtom(balanceActionsAtom);
  const [isStale] = useAtom(isBalanceStaleAtom);
  const [, setSession] = useAtom(sessionAtom);
  
  // Refs for managing async operations
  const syncInProgress = useRef(false);
  const mountedRef = useRef(true);

  /**
   * Core balance refresh logic with proper error handling
   * and state management
   */
  const refreshBalance = useCallback(async (force: boolean = false) => {
    // Prevent concurrent sync operations
    if (syncInProgress.current) return;
    
    // Skip if balance is fresh and force is false
    if (!force && !isStale) return;

    try {
      syncInProgress.current = true;
      dispatch({ type: 'SET_LOADING' });

      const response = await PaymentAPI.getBalance();

      // Handle API errors
      if (response.error) {
        throw new Error(response.error.message);
      }

      if (!response.data) {
        throw new Error('Invalid balance response');
      }

      // Update global balance state
      dispatch({ 
        type: 'UPDATE_BALANCE',
        payload: response.data
      });

      // Update session state
      setSession(prev => ({
        ...prev,
        balance: response.data,
        balanceLastUpdated: new Date().toISOString()
      }));

      // Trigger success callback
      onBalanceUpdate?.(response.data);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch balance';
      
      dispatch({ 
        type: 'SET_ERROR',
        payload: errorMessage
      });

      onError?.(new Error(errorMessage));
    } finally {
      if (mountedRef.current) {
        syncInProgress.current = false;
      }
    }
  }, [dispatch, isStale, onBalanceUpdate, onError, setSession]);

  /**
   * Initialize balance sync on mount and handle auto-refresh
   */
  useEffect(() => {
    mountedRef.current = true;

    // Initial balance fetch
    refreshBalance(true);

    // Set up auto-refresh interval if enabled
    let intervalId: NodeJS.Timeout | null = null;
    
    if (autoRefresh && refreshInterval > 0) {
      intervalId = setInterval(() => {
        if (mountedRef.current) {
          refreshBalance();
        }
      }, refreshInterval);
    }

    // Cleanup function
    return () => {
      mountedRef.current = false;
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [refreshBalance, autoRefresh, refreshInterval]);

  return {
    /** Current balance state */
    balance: balanceState.data,
    /** Loading state indicator */
    isLoading: balanceState.isLoading,
    /** Last error message if any */
    error: balanceState.error,
    /** Manual refresh trigger */
    refresh: () => refreshBalance(true),
    /** Indicator for stale balance */
    isStale
  };
};

export type { UseBalanceSyncOptions };