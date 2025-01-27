// src/components/auth/VerificationBanner.tsx
import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { AlertTriangle, X } from 'lucide-react';
import { ROUTES } from '@/config/routes';

interface VerificationBannerProps {
  userEmail: string;
}

export const VerificationBanner: React.FC<VerificationBannerProps> = ({ userEmail }) => {
  const router = useRouter();
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) return null;

  return (
    <div className="bg-game-500/10 border-l-4 border-game-500 p-4 relative">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <AlertTriangle className="h-5 w-5 text-game-500" />
          <div className="ml-3">
            <p className="text-sm text-gray-300">
              Want to unlock all features? Verify your email address to access premium content.
            </p>
            <p className="text-xs text-gray-400 mt-1">
              You can continue playing without verification
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push({
              pathname: ROUTES.public.auth.verify,
              query: { email: userEmail }
            })}
            className="px-4 py-2 text-sm bg-game-500 text-white rounded-lg 
                     hover:bg-game-600 transition-colors duration-200
                     transform hover:scale-105 active:scale-95"
          >
            Verify Now
          </button>
          
          <button
            onClick={() => setIsVisible(false)}
            className="p-1 hover:bg-game-500/20 rounded-full transition-colors"
            aria-label="Dismiss"
          >
            <X className="h-5 w-5 text-gray-400" />
          </button>
        </div>
      </div>
    </div>
  );
};