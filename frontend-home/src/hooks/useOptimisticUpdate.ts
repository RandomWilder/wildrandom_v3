// File: /src/hooks/useOptimisticUpdate.ts

import { useCallback, useState } from 'react';
import { useAtom } from 'jotai';
import { cacheStoreAtom, cacheUtils, cacheConfigAtom } from '../stores/cache';

interface OptimisticUpdateOptions<T, U> {
  key: string;
  updateFn: (data: T) => Promise<U>;
  rollbackFn?: (error: Error) => void;
  onSuccess?: (result: U) => void;
  onError?: (error: Error) => void;
}

export function useOptimisticUpdate<T, U = void>({
  key,
  updateFn,
  rollbackFn,
  onSuccess,
  onError,
}: OptimisticUpdateOptions<T, U>) {
  const [cache, setCache] = useAtom(cacheStoreAtom);
  const [config] = useAtom(cacheConfigAtom);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const performUpdate = useCallback(async (optimisticData: T) => {
    const previousData = cache[key];
    
    try {
      setIsUpdating(true);
      setError(null);

      const optimisticEntry = cacheUtils.createEntry(optimisticData, config);
      setCache(prev => ({
        ...prev,
        [key]: optimisticEntry,
      }));

      const result = await updateFn(optimisticData);
      
      if (result !== undefined) {
        const resultEntry = cacheUtils.createEntry(result as unknown as T, config);
        setCache(prev => ({
          ...prev,
          [key]: resultEntry,
        }));
      }

      onSuccess?.(result);
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Update failed');
      setError(error);
      
      if (previousData) {
        setCache(prev => ({
          ...prev,
          [key]: previousData,
        }));
      }

      rollbackFn?.(error);
      onError?.(error);
      throw error;
    } finally {
      setIsUpdating(false);
    }
  }, [key, updateFn, cache, setCache, config, rollbackFn, onSuccess, onError]);

  return {
    performUpdate,
    isUpdating,
    error,
  };
}