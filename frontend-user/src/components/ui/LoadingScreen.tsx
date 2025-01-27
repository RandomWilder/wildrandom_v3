// src/components/ui/LoadingScreen.tsx
import React from 'react';

export const LoadingScreen: React.FC = () => {
  return (
    <div className="min-h-screen bg-surface-dark flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-game-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-white text-lg animate-pulse">Loading your gaming experience...</p>
      </div>
    </div>
  );
};