// src/types/balance.ts

import type { PurchaseTransaction } from '../api/types/payment';

/**
 * Balance Management Type System
 * 
 * Implements a comprehensive type hierarchy for balance operations
 * with proper export patterns and type safety guarantees.
 * 
 * Architectural Considerations:
 * - Single source of truth for balance-related types
 * - Strict type safety and validation
 * - Integration with transaction systems
 * - Runtime type checking capabilities
 */

/**
 * Balance synchronization status enumeration
 * @enum {string}
 */
export enum BalanceSyncStatus {
  IDLE = 'IDLE',
  SYNCING = 'SYNCING',
  FAILED = 'FAILED',
  SUCCESS = 'SUCCESS'
}

/**
 * Balance update source tracking
 * @enum {string}
 */
export enum BalanceUpdateSource {
  SYNC = 'SYNC',
  PURCHASE = 'PURCHASE',
  MANUAL = 'MANUAL',
  SYSTEM = 'SYSTEM'
}

/**
 * Balance update event interface
 * @interface
 */
export interface BalanceUpdateEvent {
  timestamp: string;
  source: BalanceUpdateSource;
  previousBalance: number;
  newBalance: number;
  transaction?: PurchaseTransaction;
  metadata?: Record<string, unknown>;
}

/**
 * Balance synchronization error interface
 * @interface
 */
export interface BalanceSyncError {
  code: string;
  message: string;
  timestamp: string;
  retryCount: number;
  source: BalanceUpdateSource;
}

/**
 * Balance synchronization configuration
 * @interface
 */
export interface BalanceSyncConfig {
  refreshInterval: number;
  maxRetries: number;
  minRefreshInterval: number;
  enableAutoSync: boolean;
  onBalanceUpdate?: (event: BalanceUpdateEvent) => void;
  onSyncError?: (error: BalanceSyncError) => void;
}

/**
 * Core balance state interface
 * @interface
 */
export interface BalanceState {
  amount: number;
  lastSynced: string | null;
  syncStatus: BalanceSyncStatus;
  lastError: BalanceSyncError | null;
  updateHistory: BalanceUpdateEvent[];
  syncConfig: BalanceSyncConfig;
}

/**
 * Type guard implementations for runtime validation
 * @namespace Guards
 */
export const Guards = {
  isBalanceUpdateEvent(event: unknown): event is BalanceUpdateEvent {
    return (
      typeof event === 'object' &&
      event !== null &&
      'timestamp' in event &&
      'source' in event &&
      'previousBalance' in event &&
      'newBalance' in event &&
      Object.values(BalanceUpdateSource).includes((event as BalanceUpdateEvent).source)
    );
  },

  isBalanceSyncError(error: unknown): error is BalanceSyncError {
    return (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      'message' in error &&
      'timestamp' in error &&
      'retryCount' in error &&
      'source' in error
    );
  }
};

/**
 * Factory function for balance configuration
 * @function
 */
export const createBalanceConfig = (
  overrides?: Partial<BalanceSyncConfig>
): BalanceSyncConfig => ({
  refreshInterval: 30000,
  maxRetries: 3,
  minRefreshInterval: 5000,
  enableAutoSync: true,
  ...overrides
});

/**
 * Balance validation utilities
 * @namespace Validators
 */
export const Validators = {
  isValidAmount(amount: number): boolean {
    return !isNaN(amount) && isFinite(amount) && amount >= 0;
  },

  isValidUpdateEvent(event: BalanceUpdateEvent): boolean {
    return (
      this.isValidAmount(event.previousBalance) &&
      this.isValidAmount(event.newBalance) &&
      new Date(event.timestamp).getTime() <= Date.now()
    );
  }
};