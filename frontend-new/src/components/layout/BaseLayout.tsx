import { useAuthStore } from '@/stores/auth-store';
import { LayoutProps } from '@/types/layouts';
import { Toaster } from '@/components/ui/toaster';

export function BaseLayout({ children }: LayoutProps) {
  const { isAuthenticated } = useAuthStore();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Global elements */}
      <main className="h-full">{children}</main>
      
      {/* Placeholder for future notification system */}
      <Toaster />
      
      {/* Global modals container */}
      <div id="modal-root" />
    </div>
  );
}