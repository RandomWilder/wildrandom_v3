import { Loader2 } from 'lucide-react';

export function LoadingSpinner({ className = '' }: { className?: string }) {
  return (
    <Loader2 className={`h-6 w-6 animate-spin text-primary ${className}`} />
  );
}

export function LoadingOverlay() {
  return (
    <div className="fixed inset-0 bg-white/80 flex items-center justify-center z-50">
      <LoadingSpinner className="h-8 w-8" />
    </div>
  );
}