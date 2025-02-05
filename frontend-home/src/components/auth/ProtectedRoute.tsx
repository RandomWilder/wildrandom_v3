// File: /src/components/auth/ProtectedRoute.tsx

import { FC, ReactNode, useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAtom } from 'jotai';
import { sessionAtom } from '../../stores/session';
import { Loader } from 'lucide-react';
import { authAPI } from '../../api/client';


interface ProtectedRouteProps {
  children: ReactNode;
  fallbackPath?: string;
}

export const ProtectedRoute: FC<ProtectedRouteProps> = ({ 
  children, 
  fallbackPath = '/auth/login' 
}) => {
  const [session, setSession] = useAtom(sessionAtom);
  const navigate = useNavigate();
  const location = useLocation();
  const [isValidating, setIsValidating] = useState(true);

  useEffect(() => {
    const validateSession = async () => {
      if (!session.token) {
        setIsValidating(false);
        navigate(fallbackPath, { state: { from: location } });
        return;
      }

      try {
        // Verify token validity with backend
        const response = await authAPI.getProfile();
        setSession(prev => ({
          ...prev,
          user: response.data,
          lastActivity: new Date().toISOString()
        }));
        setIsValidating(false);
      } catch (error) {
        setSession(prev => ({
          ...prev,
          token: null,
          user: null
        }));
        setIsValidating(false);
        navigate(fallbackPath, { 
          state: { 
            from: location,
            message: 'Your session has expired. Please sign in again.'
          }
        });
      }
    };

    validateSession();
  }, [session.token, setSession, navigate, location, fallbackPath]);

  if (isValidating) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <div className="flex items-center space-x-4">
          <Loader className="w-8 h-8 text-indigo-600 animate-spin" />
          <p className="text-lg text-gray-600">Verifying your session...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};