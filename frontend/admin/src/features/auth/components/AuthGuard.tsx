import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useAuthStore } from '../store/AuthStore';

const PUBLIC_PATHS = ['/login'];

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    // Don't check auth during initial render
    if (router.isReady) {
      const isPublicPath = PUBLIC_PATHS.includes(router.pathname);

      if (!isAuthenticated && !isPublicPath) {
        router.push('/login');
      } else if (isAuthenticated && isPublicPath) {
        router.push('/admin/dashboard');
      } else {
        setAuthorized(true);
      }
    }
  }, [isAuthenticated, router, router.isReady, router.pathname]);

  // Prevent flash of protected content
  if (!authorized) {
    return null;
  }

  return <>{children}</>;
}