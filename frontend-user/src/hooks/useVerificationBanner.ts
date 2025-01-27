// src/hooks/useVerificationState.ts
import { useState, useEffect } from 'react';
import { AuthService } from '@/lib/auth';

export const useVerificationState = () => {
  const [showBanner, setShowBanner] = useState(false);
  const user = AuthService.getUser();

  useEffect(() => {
    // Only show banner if user exists and isn't verified
    setShowBanner(Boolean(user?.email && !user?.is_verified));
  }, [user]);

  return {
    showBanner,
    userEmail: user?.email
  };
};