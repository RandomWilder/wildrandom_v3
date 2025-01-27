// src/components/pages/RaffleHomepage.tsx
import React, { useState, useEffect } from 'react';
import { UserProfileMenu } from '@/components/navigation/UserProfileMenu';
import { Sidebar } from '@/components/navigation/Sidebar';
import { RaffleCard } from '@/components/raffle/RaffleCard';
import { UserStats } from '@/components/dashboard/UserStats';
import { AuthService } from '@/lib/auth';
import { useRouter } from 'next/router';
import { useVerificationState } from '@/hooks/useVerificationBanner';
import { Bell, Menu, X, RefreshCw } from 'lucide-react';
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import type { Raffle } from '@/types/raffle';
import type { LoyaltyStatus } from '@/types/loyalty.types';
import { VerificationBanner } from '@/components/auth/VerificationBanner';
import { API_CONFIG } from '@/config/api.config';

const RaffleHomepage: React.FC = () => {
  const router = useRouter();
  const { showBanner, userEmail } = useVerificationState();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [raffles, setRaffles] = useState<Raffle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loyaltyStatus, setLoyaltyStatus] = useState<LoyaltyStatus | undefined>();
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const user = AuthService.getUser();
  const token = AuthService.getAuthToken();

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      
      const response = await fetch('http://localhost:5000/api/raffles', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': AuthService.getAuthToken() ? `Bearer ${AuthService.getAuthToken()}` : ''
        },
        credentials: 'include'
      });
  
      const data = await response.json();
      if (!Array.isArray(data.raffles)) {
        throw new Error('Invalid raffle data format');
      }
      
      setRaffles(data.raffles);
  
      // Only attempt loyalty fetch if authenticated
      if (user) {
        const loyaltyResponse = await fetch('http://localhost:5000/api/users/loyalty/status', {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${AuthService.getAuthToken()}`
          },
          credentials: 'include'
        });
  
        if (loyaltyResponse.ok) {
          const loyaltyData = await loyaltyResponse.json();
          setLoyaltyStatus(loyaltyData);
        }
      }
  
      setError(null);
    } catch (err) {
      console.error('Dashboard data fetch error:', err);
      setError('Failed to load game data. Please try again later.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [user]);

  const handleManualRefresh = async () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    await fetchDashboardData();
  };

  // Header Component with Game-Style UI
  const Header = () => (
    <header className="bg-surface-dark border-b border-gray-800 px-4 py-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-lg hover:bg-surface-hover transition-colors duration-200 ease-gaming"
          >
            {sidebarOpen ? (
              <X className="w-6 h-6 text-gray-400" />
            ) : (
              <Menu className="w-6 h-6 text-gray-400" />
            )}
          </button>
          <h1 className="ml-4 text-xl font-bold text-white">
            WildRandom Raffles
          </h1>
        </div>
  
        <div className="flex items-center space-x-4">
          {/* Manual Refresh Button */}
          <button 
            onClick={handleManualRefresh}
            disabled={isRefreshing}
            className="relative p-2 rounded-lg hover:bg-surface-hover 
                     transition-colors duration-200 ease-gaming
                     disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw className={`w-6 h-6 text-gray-400 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>

          {/* Notifications */}
          <button className="relative p-2 rounded-lg hover:bg-surface-hover 
                           transition-colors duration-200 ease-gaming">
            <Bell className="w-6 h-6 text-gray-400" />
            <span className="absolute top-0 right-0 w-2 h-2 bg-game-500 rounded-full 
                           animate-pulse-glow" />
          </button>
  
          {/* User Profile Menu */}
          <UserProfileMenu />
        </div>
      </div>
    </header>
  );

  const RaffleLoadingState = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {[1, 2, 3].map((i) => (
        <div 
          key={i} 
          className="h-64 bg-surface-card rounded-xl animate-pulse 
                    relative overflow-hidden
                    before:absolute before:inset-0
                    before:bg-gradient-to-r before:from-transparent 
                    before:via-surface-hover before:to-transparent
                    before:animate-shimmer"
        />
      ))}
    </div>
  );

  const RaffleContent = () => {
    if (raffles.length === 0 && !isLoading) {
      return (
        <div className="text-center py-8">
          <p className="text-gray-400">No active raffles available.</p>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {raffles.map((raffle) => (
          <RaffleCard key={raffle.id} raffle={raffle} />
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-surface-dark">
      <Header />
      <Sidebar isOpen={sidebarOpen} />

      <main className={`
        transition-all duration-200 ease-gaming
        ${sidebarOpen ? 'ml-64' : 'ml-0'}
      `}>
        <div className="p-6 space-y-6">
          {showBanner && userEmail && (
            <div className="mb-6">
              <VerificationBanner userEmail={userEmail} />
            </div>
          )}

          {user && (
            <UserStats 
              user={user}
              loyaltyStatus={loyaltyStatus}
            />
          )}

          {error && (
            <Alert variant="destructive">
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-white">
                Active Raffles
              </h2>
            </div>
            
            {isLoading ? <RaffleLoadingState /> : <RaffleContent />}
          </div>
        </div>
      </main>
    </div>
  );
};

export default RaffleHomepage;