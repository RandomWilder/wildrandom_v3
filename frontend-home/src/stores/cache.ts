// src/stores/cache.ts

/**
 * Cache Management Store
 * 
 * Provides centralized cache management for application data with type-safe
 * operations and controlled invalidation patterns.
 * 
 * @module stores/cache
 */

import { atom } from 'jotai';
import { atomWithStorage } from 'jotai/utils';

// #region Interfaces
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  staleAt: number;
}

interface CacheConfig {
  maxAge: number;
  staleTime: number;
}

interface CacheData {
  data: unknown;
  isStale: boolean;
}
// #endregion

// #region Constants
const DEFAULT_CACHE_CONFIG: CacheConfig = {
  maxAge: 1000 * 60 * 30,    // 30 minutes
  staleTime: 1000 * 60 * 5   // 5 minutes
};
// #endregion

// #region Store Definitions
export const cacheStoreAtom = atomWithStorage<Record<string, CacheEntry<unknown>>>(
  'cache_store',
  {}
);

export const cacheConfigAtom = atom<CacheConfig>(DEFAULT_CACHE_CONFIG);
// #endregion

// #region Utility Functions
export const cacheUtils = {
  generateKey(endpoint: string): string {
    return endpoint;
  },

  isStale(entry: CacheEntry<unknown>, config: CacheConfig): boolean {
    return Date.now() >= entry.timestamp + config.staleTime;
  },

  isExpired(entry: CacheEntry<unknown>, config: CacheConfig): boolean {
    return Date.now() >= entry.timestamp + config.maxAge;
  },

  createEntry<T>(data: T, config: CacheConfig): CacheEntry<T> {
    const timestamp = Date.now();
    return {
      data,
      timestamp,
      staleAt: timestamp + config.staleTime
    };
  }
};
// #endregion

// #region Cache Operations
export function createCacheOperationsAtom<T>(key: string) {
  return atom(
    (get) => {
      const cache = get(cacheStoreAtom);
      const config = get(cacheConfigAtom);
      const entry = cache[key] as CacheEntry<T> | undefined;

      if (!entry || cacheUtils.isExpired(entry, config)) {
        return undefined;
      }

      return {
        data: entry.data as T,
        isStale: cacheUtils.isStale(entry, config)
      };
    },
    (get, set, update: T) => {
      const config = get(cacheConfigAtom);
      const entry = cacheUtils.createEntry(update, config);
      
      set(cacheStoreAtom, (prev) => ({
        ...prev,
        [key]: entry
      }));
    }
  );
}
// #endregion

export type { CacheEntry, CacheConfig, CacheData };