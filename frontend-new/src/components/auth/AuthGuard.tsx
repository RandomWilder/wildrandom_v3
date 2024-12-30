import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useAuthStore } from '@/stores/auth-store';
import { LoadingSpinner } from '@/components/ui/loading'; // We'll create this later

const PUBLIC_PATHS = ['/admin/login'];

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    // Don't run auth check during the initial render
    if (router.isReady) {
      const isPublicPath = PUBLIC_PATHS.includes(router.pathname);

      if (!isAuthenticated && !isPublicPath) {
        // Redirect to login page if accessing protected route without auth
        router.push('/admin/login');
      } else if (isAuthenticated && isPublicPath) {
        // Redirect to dashboard if accessing login page while authenticated
        router.push('/admin/dashboard');
      } else {
        setAuthorized(true);
      }
    }
  }, [isAuthenticated, router, router.isReady, router.pathname]);

  // Show loading spinner while performing auth check
  if (!router.isReady || !authorized) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return <>{children}</>;
}