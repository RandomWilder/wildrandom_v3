// frontend/admin/src/components/ui/error.tsx

import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from './alert';

interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
}

export function ErrorState({ title = 'Error', message, onRetry }: ErrorStateProps) {
  return (
    <Alert variant="destructive">
      <AlertCircle className="h-4 w-4 absolute left-4 top-4 text-red-500" />
      <AlertTitle className="pl-7">{title}</AlertTitle>
      <AlertDescription className="pl-7">
        <div className="flex flex-col space-y-2">
          <p>{message}</p>
          {onRetry && (
            <button
              onClick={onRetry}
              className="text-sm underline hover:text-red-800 transition-colors"
            >
              Try again
            </button>
          )}
        </div>
      </AlertDescription>
    </Alert>
  );
}