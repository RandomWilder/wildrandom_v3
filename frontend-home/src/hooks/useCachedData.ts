// src/hooks/useCachedData.ts

import { useEffect, useRef, useState, useCallback } from 'react';
import { useAtom } from 'jotai';
import { cacheStoreAtom, cacheConfigAtom, cacheUtils } from '../stores/cache';
import type { CacheEntry } from '../stores/cache';

interface UseCachedDataOptions<T> {
  key: string;
  fetcher: () => Promise<T>;
  initialData?: T;
  onError?: (error: Error) => void;
  revalidateOnMount?: boolean;
  revalidateOnFocus?: boolean;
}

interface UseCachedDataState<T> {
  data?: T;
  isLoading: boolean;
  isValidating: boolean;
  error: Error | null;
}

export function useCachedData<T>({
  key,
  fetcher,
  initialData,
  onError,
  revalidateOnMount = true,
  revalidateOnFocus = false,
}: UseCachedDataOptions<T>) {
  const mounted = useRef(false);
  const fetchingRef = useRef(false);
  const [cache, setCache] = useAtom(cacheStoreAtom);
  const [config] = useAtom(cacheConfigAtom);
  
  const [state, setState] = useState<UseCachedDataState<T>>(() => {
    const cachedEntry = cache[key] as CacheEntry<T> | undefined;
    const isStale = cachedEntry && cacheUtils.isStale(cachedEntry, config);
    
    return {
      data: isStale ? undefined : cachedEntry?.data ?? initialData,
      isLoading: false,
      isValidating: false,
      error: null
    };
  });

  const updateCache = useCallback((data: T) => {
    const entry = cacheUtils.createEntry(data, config);
    setCache(prevCache => ({
      ...prevCache,
      [key]: entry
    }));
  }, [key, config, setCache]);

  const fetchData = useCallback(async (shouldSetLoading = true) => {
    if (fetchingRef.current) return;
    fetchingRef.current = true;

    try {
      if (shouldSetLoading && mounted.current) {
        setState(currentState => ({
          ...currentState,
          isLoading: true,
          isValidating: true
        }));
      }

      const data = await fetcher();
      
      if (mounted.current) {
        updateCache(data);
        setState(currentState => ({
          ...currentState,
          data,
          isLoading: false,
          isValidating: false,
          error: null
        }));
      }
      
      return data;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to fetch data');
      
      if (mounted.current) {
        setState(currentState => ({
          ...currentState,
          isLoading: false,
          isValidating: false,
          error
        }));
      }
      
      onError?.(error);
      throw error;
    } finally {
      fetchingRef.current = false;
    }
  }, [fetcher, onError, updateCache]);

  useEffect(() => {
    mounted.current = true;
    
    const cachedEntry = cache[key] as CacheEntry<T> | undefined;
    const shouldFetch = revalidateOnMount || 
      !cachedEntry || 
      cacheUtils.isStale(cachedEntry, config);

    if (key && shouldFetch) {
      fetchData();
    }

    return () => {
      mounted.current = false;
    };
  }, [key, revalidateOnMount, cache, config, fetchData]);

  useEffect(() => {
    if (!revalidateOnFocus) return;

    const handleFocus = () => {
      const cachedEntry = cache[key] as CacheEntry<T> | undefined;
      if (key && !fetchingRef.current && cachedEntry && cacheUtils.isStale(cachedEntry, config)) {
        fetchData(false);
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [revalidateOnFocus, key, cache, config, fetchData]);

  const mutate = useCallback(async (data?: T) => {
    if (data !== undefined) {
      updateCache(data);
      setState(currentState => ({
        ...currentState,
        data,
        error: null
      }));
    } else {
      await fetchData();
    }
  }, [fetchData, updateCache]);

  return {
    data: state.data,
    isLoading: state.isLoading,
    isValidating: state.isValidating,
    error: state.error,
    mutate
  };
}