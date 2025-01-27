// src/components/auth/withAuth.tsx
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { AuthService } from '@/lib/auth';
import { LoadingScreen } from '@/components/ui/LoadingScreen';
import { ROUTES } from '@/config/routes';

/**
 * HOC for protecting routes that require authentication.
 * Handles basic auth state without enforcing verification.
 */
export function withAuth<P extends object>(WrappedComponent: React.ComponentType<P>) {
  return function WithAuthComponent(props: P) {
    const router = useRouter();
    const [isVerifying, setIsVerifying] = useState(true);
    
    useEffect(() => {
      const verifyAuth = async () => {
        try {
          if (!AuthService.isAuthenticated()) {
            await router.replace(ROUTES.public.auth.login);
          }
        } finally {
          // Maintain smooth UX with minimum loading duration
          setTimeout(() => setIsVerifying(false), 500);
        }
      };

      verifyAuth();
    }, [router]);

    if (isVerifying) {
      return <LoadingScreen />;
    }

    // Only require authentication, not verification
    if (!AuthService.isAuthenticated()) {
      return null;
    }

    return <WrappedComponent {...props} />;
  };
}