// src/hooks/useInterval.ts

import { useEffect, useRef } from 'react';

/**
 * Custom hook for handling setInterval with proper cleanup and type safety
 * 
 * Implements Dan Abramov's pattern for handling intervals in React components
 * with proper TypeScript support and memory management.
 * 
 * @param callback - Function to be called on each interval
 * @param delay - Interval delay in milliseconds (null to pause)
 * 
 * @example
 * ```tsx
 * useInterval(() => {
 *   // Update countdown
 *   setTimeRemaining(prev => prev - 1);
 * }, isActive ? 1000 : null);
 * ```
 */
export function useInterval(callback: () => void, delay: number | null) {
  const savedCallback = useRef<() => void>();

  // Remember the latest callback
  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  // Set up the interval
  useEffect(() => {
    // Don't schedule if no delay is specified
    if (delay === null) return;

    const tick = () => {
      savedCallback.current?.();
    };

    const id = setInterval(tick, delay);
    return () => clearInterval(id);
  }, [delay]);
}