// src/components/dashboard/UserStats.tsx
import React from 'react';
import { Wallet, Crown, Trophy } from 'lucide-react';
import type { User } from '@/types/auth.types';
import type { LoyaltyStatus } from '@/types/loyalty.types';

interface UserStatsProps {
  user: User;
  loyaltyStatus?: LoyaltyStatus;
}

export const UserStats: React.FC<UserStatsProps> = ({ user, loyaltyStatus }) => {
  // Helper function to ensure type-safe number formatting
  const formatCurrency = (amount: number): string => {
    return amount.toFixed(2);
  };

  // Helper function to render loyalty streak if available
  const renderLoyaltyStreak = (status: LoyaltyStatus | undefined) => {
    if (!status?.streak_days) return null;
    
    return (
      <div className="flex justify-between items-center">
        <span className="text-gray-400">Active Streak</span>
        <span className="text-lg text-gray-300">
          {status.streak_days} days
        </span>
      </div>
    );
  };

  // Helper function to calculate progress percentage safely
  const calculateProgress = (entries: number | undefined): number => {
    if (!entries) return 0;
    return Math.min((entries / 100) * 100, 100);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4">
      {/* Balance Card */}
      <div className="bg-surface-card rounded-xl p-6 border border-gray-800 hover:border-game-500/50 transition-colors">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">Balance</h3>
          <Wallet className="w-6 h-6 text-game-400" />
        </div>
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-gray-400">Available</span>
            <span className="text-2xl font-bold text-white">
              ${formatCurrency(user.balance.available)}
            </span>
          </div>
          {user.balance.pending > 0 && (
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Pending</span>
              <span className="text-lg text-gray-300">
                ${formatCurrency(user.balance.pending)}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Loyalty Level Card */}
      <div className="bg-surface-card rounded-xl p-6 border border-gray-800 hover:border-game-500/50 transition-colors">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">Loyalty Status</h3>
          <Crown className="w-6 h-6 text-game-400" />
        </div>
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-gray-400">Current Level</span>
            <span className="text-xl font-bold text-game-400 uppercase">
              {loyaltyStatus?.level || 'NEWBIE'}
            </span>
          </div>
          {renderLoyaltyStreak(loyaltyStatus)}
        </div>
      </div>

      {/* Progress Card */}
      {loyaltyStatus && (
        <div className="bg-surface-card rounded-xl p-6 border border-gray-800 hover:border-game-500/50 transition-colors">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">Level Progress</h3>
            <Trophy className="w-6 h-6 text-game-400" />
          </div>
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Total Entries</span>
                <span className="text-white">{loyaltyStatus.total_entries}</span>
              </div>
              <div className="h-2 bg-surface-hover rounded-full overflow-hidden">
                <div 
                  className="h-full bg-game-500 rounded-full transition-all duration-500"
                  style={{ 
                    width: `${calculateProgress(loyaltyStatus.total_entries)}%` 
                  }}
                />
              </div>
            </div>
            
            {loyaltyStatus.badges && loyaltyStatus.badges.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {loyaltyStatus.badges.map((badge, index) => (
                  <span 
                    key={index}
                    className="px-2 py-1 text-xs rounded-full bg-game-500/20 text-game-400"
                  >
                    {badge}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};