// frontend/admin/src/components/ui/loading.tsx
import { Loader2 } from 'lucide-react';

export function LoadingSpinner({ className = '' }: { className?: string }) {
  return (
    <div className={`flex justify-center items-center ${className}`}>
      <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
    </div>
  );
}

export function LoadingOverlay() {
  return (
    <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
      <LoadingSpinner />
    </div>
  );
}
