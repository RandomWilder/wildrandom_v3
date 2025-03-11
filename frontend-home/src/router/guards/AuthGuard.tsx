/**
 * Authentication Guard
 * 
 * Protects gameplay routes with:
 * - Session validation
 * - State preservation
 * - Elegant transitions
 * - Recovery paths
 */

import { FC, ReactNode, useEffect } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAtom } from 'jotai';
import { authStateAtom } from '../../stores/auth';
import { authAPI } from '../../api/client';
import { Loader } from 'lucide-react';

interface AuthGuardProps {
  children: ReactNode;
  fallbackUrl?: string;
}

const AuthGuard: FC<AuthGuardProps> = ({ 
  children, 
  fallbackUrl = '/auth/login' 
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [authState, setAuthState] = useAtom(authStateAtom);

  useEffect(() => {
    let mounted = true;

    const validateSession = async () => {
      if (!authState.isAuthenticated && (localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token'))) {
        try {
          setAuthState(prev => ({ ...prev, isLoading: true }));
          const response = await authAPI.getProfile();
          
          if (mounted) {
            const tokenExpiry = new Date();
            tokenExpiry.setHours(tokenExpiry.getHours() + 24);

            setAuthState({
              user: response.data,
              isAuthenticated: true,
              isLoading: false,
              error: null,
              token: localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token'),
              tokenExpiry: tokenExpiry.toISOString(),
              refreshInProgress: false
            });
          }
        } catch (error) {
          if (mounted) {
            // Clear invalid session state
            localStorage.removeItem('auth_token');
            sessionStorage.removeItem('auth_token');
            
            setAuthState({
              user: null,
              isAuthenticated: false,
              isLoading: false,
              error: 'Session expired',
              token: null,
              tokenExpiry: null,
              refreshInProgress: false
            });
            
            // Redirect with state preservation
            navigate(fallbackUrl, { 
              state: { 
                from: location,
                message: 'Your session has expired. Please sign in to continue playing.' 
              },
              replace: true 
            });
          }
        }
      }
    };

    validateSession();

    return () => {
      mounted = false;
    };
  }, [setAuthState, location, navigate, fallbackUrl, authState.isAuthenticated]);

  // Loading state with engaging animation
  if (authState.isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center space-y-4">
          <Loader className="w-12 h-12 text-indigo-600 animate-spin" />
          <p className="text-gray-600">Validating your session...</p>
        </div>
      </div>
    );
  }

  // Redirect unauthorized access
  if (!authState.isAuthenticated) {
    return <Navigate to={fallbackUrl} state={{ from: location }} replace />;
  }

  // Render protected route
  return <>{children}</>;
};

export default AuthGuard;