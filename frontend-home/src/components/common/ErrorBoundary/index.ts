// File: /src/components/common/ErrorBoundary/index.ts

export { GlobalErrorBoundary } from './GlobalErrorBoundary';
export { FeatureErrorBoundary } from './FeatureErrorBoundary';

// Custom hook for error boundary usage
import { useCallback, useState } from 'react';

interface ErrorBoundaryHookReturn {
  error: Error | null;
  resetError: () => void;
  throwError: (error: Error) => void;
}

export const useErrorBoundary = (): ErrorBoundaryHookReturn => {
  const [error, setError] = useState<Error | null>(null);

  const resetError = useCallback(() => {
    setError(null);
  }, []);

  const throwError = useCallback((error: Error) => {
    setError(error);
  }, []);

  return { error, resetError, throwError };
};