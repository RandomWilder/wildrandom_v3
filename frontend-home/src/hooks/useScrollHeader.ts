// src/hooks/useScrollHeader.ts

import { useState, useEffect, useCallback } from 'react';

interface ScrollHeaderState {
  isVisible: boolean;
  lastScrollY: number;
  scrollDirection: 'up' | 'down' | null;
}

/**
 * Hook for managing scroll-aware header behavior
 * Implements progressive enhancement for scroll direction detection
 * and state management with proper debouncing and performance optimization
 */
export const useScrollHeader = () => {
  const [state, setState] = useState<ScrollHeaderState>({
    isVisible: true,
    lastScrollY: 0,
    scrollDirection: null
  });

  // Debounced scroll handler with RAF for performance
  const handleScroll = useCallback(() => {
    requestAnimationFrame(() => {
      const currentScrollY = window.scrollY;
      const scrollDirection = currentScrollY > state.lastScrollY ? 'down' : 'up';
      
      setState(prevState => ({
        isVisible: scrollDirection === 'up' || currentScrollY < 50,
        lastScrollY: currentScrollY,
        scrollDirection
      }));
    });
  }, [state.lastScrollY]);

  // Effect for scroll listener management
  useEffect(() => {
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  return {
    isVisible: state.isVisible,
    scrollDirection: state.scrollDirection
  };
};