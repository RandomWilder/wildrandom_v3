// src/components/auth/ProtectedRoute.tsx
import { FC, ReactNode, useEffect, useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAtom } from 'jotai';
import { sessionAtom } from '../../stores/session';
import { authStateAtom } from '../../stores/auth';
import { Loader } from '../../components/common/icons';
import { authAPI } from '../../api/client';

interface ProtectedRouteProps {
  children: ReactNode;
  fallbackPath?: string;
}

export const ProtectedRoute: FC<ProtectedRouteProps> = ({ 
  children,
  fallbackPath = '/' 
}) => {
  const [session] = useAtom(sessionAtom);
  const [authState] = useAtom(authStateAtom);
  const navigate = useNavigate();
  const location = useLocation();
  const [isValidating, setIsValidating] = useState(true);
  const hasNavigated = useRef(false);
  const isMounted = useRef(true);

  // Enhanced session validation with improved logging
  const isSessionActive = () => {
    // Check for token in different storage locations
    const localStorageToken = localStorage.getItem('auth_token');
    const sessionStorageToken = sessionStorage.getItem('auth_token');
    const jotaiToken = session.token;
    const authStateToken = authState.token;
    
    const hasToken = !!localStorageToken || !!sessionStorageToken || !!jotaiToken || !!authStateToken;
    const hasUserData = !!session.user || !!authState.user;
    
    // Log auth state for debugging
    console.debug('Auth state check:', {
      localStorageToken: !!localStorageToken,
      sessionStorageToken: !!sessionStorageToken,
      jotaiToken: !!jotaiToken,
      authStateToken: !!authStateToken,
      hasUserData,
      isAuthenticated: authState.isAuthenticated
    });
    
    return hasToken || hasUserData || authState.isAuthenticated;
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  // Main session validation effect with enhanced debugging
  useEffect(() => {
    if (hasNavigated.current) return;
    
    const validateSession = async () => {
      setIsValidating(true);
      
      try {
        console.log(`Validating session for protected route: ${location.pathname}`);
        
        if (!isSessionActive()) {
          console.warn('No active session detected for protected route');
          throw new Error('No active session');
        }

        // Add a safety timeout to prevent hanging
        const timeoutId = setTimeout(() => {
          if (isMounted.current) {
            console.log('Session validation completed (timeout)');
            setIsValidating(false);
          }
        }, 1000);
        
        try {
          // Optional backend validation - don't block on this
          await authAPI.getProfile();
          clearTimeout(timeoutId);
          
          if (isMounted.current) {
            console.log('Backend profile validation successful');
            setIsValidating(false);
          }
        } catch (error) {
          console.warn('Backend profile validation failed, using local session state', error);
          // Don't throw here - fall back to local validation
          if (isMounted.current) {
            setIsValidating(false);
          }
        }
      } catch (error) {
        console.warn(`Session validation failed for ${location.pathname}:`, error);
        
        if (isMounted.current && !hasNavigated.current) {
          hasNavigated.current = true;
          
          navigate(fallbackPath, {
            state: { 
              returnTo: location.pathname,
              message: 'Please sign in to continue'
            },
            replace: true
          });
        }
      }
    };

    validateSession();
  }, [session, authState, navigate, location.pathname, fallbackPath]);

  // Show loading indicator during validation
  if (isValidating) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <Loader className="w-8 h-8 text-indigo-600 animate-spin" />
      </div>
    );
  }

  return <>{children}</>;
};