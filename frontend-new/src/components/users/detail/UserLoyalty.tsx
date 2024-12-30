import React, { useEffect, useMemo } from 'react';
import { 
  Trophy,
  Crown,
  Star,
  Clock,
  TrendingUp,
  Medal,
  Calendar,
  AlertCircle
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { LoadingSpinner } from '@/components/ui/loading';
import {
  UserLevel,
  BadgeType,
  type LoyaltyBadge,
  type LoyaltyHistory,
  LEVEL_META,
  BADGE_META,
  LEVEL_REQUIREMENTS,
  LEVEL_BENEFITS
} from '@/types/users/loyalty';
import { formatDate } from '@/utils/date';
import { formatCurrency } from '@/utils/currency';
import { cn } from '@/lib/utils';


interface UserLoyaltyProps {
  userId: number;
  className?: string;
}

interface LevelProgressCardProps {
  currentLevel: UserLevel;
  totalSpend: number;
  totalEntries: number;
  earnedBadges: Set<BadgeType>;
}

interface BadgeDisplayProps {
  badge: LoyaltyBadge;
  size?: 'sm' | 'md' | 'lg';
}

interface LevelBenefitsCardProps {
  level: UserLevel;
}

interface LoyaltyHistoryCardProps {
  history: LoyaltyHistory[];
}

// Level Progress Card Component
const LevelProgressCard: React.FC<LevelProgressCardProps> = ({
  currentLevel,
  totalSpend,
  totalEntries,
  earnedBadges
}) => {
  // Find next level requirements
  const levels = Object.values(UserLevel);
  const currentIndex = levels.indexOf(currentLevel);
  const nextLevel = currentIndex < levels.length - 1 ? levels[currentIndex + 1] : null;

  if (!nextLevel) {
    return (
      <Card className="p-6">
        <div className="flex items-center space-x-3">
          <Crown className="h-8 w-8 text-indigo-500" />
          <div>
            <h3 className="text-lg font-medium text-gray-900">
              Maximum Level Achieved
            </h3>
            <p className="text-sm text-gray-500">
              You've reached the highest loyalty tier!
            </p>
          </div>
        </div>
      </Card>
    );
  }

  const nextRequirements = LEVEL_REQUIREMENTS[nextLevel];
  
  // Calculate progress percentages
  const spendProgress = Math.min(
    (totalSpend / nextRequirements.min_spend) * 100,
    100
  );
  const entriesProgress = Math.min(
    (totalEntries / nextRequirements.min_entries) * 100,
    100
  );

  // Check which badges are still needed
  const neededBadges = Array.from(nextRequirements.required_badges)
    .filter(badge => !earnedBadges.has(badge));

  return (
    <Card className="p-6">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <TrendingUp className="h-6 w-6 text-indigo-500" />
            <h3 className="text-lg font-medium text-gray-900">
              Progress to {LEVEL_META[nextLevel].label}
            </h3>
          </div>
        </div>

        <div className="space-y-4">
          {/* Spend Progress */}
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-gray-500">Total Spend</span>
              <span className="text-gray-900 font-medium">
                {formatCurrency(totalSpend)} / {formatCurrency(nextRequirements.min_spend)}
              </span>
            </div>
            <Progress value={spendProgress} className="h-2" />
          </div>

          {/* Entries Progress */}
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-gray-500">Total Entries</span>
              <span className="text-gray-900 font-medium">
                {totalEntries} / {nextRequirements.min_entries}
              </span>
            </div>
            <Progress value={entriesProgress} className="h-2" />
          </div>

          {/* Required Badges */}
          {neededBadges.length > 0 && (
            <div className="mt-4">
              <p className="text-sm font-medium text-gray-700 mb-2">
                Required Badges
              </p>
              <div className="flex flex-wrap gap-2">
                {neededBadges.map(badge => (
                  <span
                    key={badge}
                    className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs
                             bg-gray-100 text-gray-700"
                  >
                    {BADGE_META[badge].label}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};

// Badge Display Component
const BadgeDisplay: React.FC<BadgeDisplayProps> = ({ badge, size = 'md' }) => {
  const meta = BADGE_META[badge.type];
  const sizeClasses = {
    sm: 'p-2 text-xs',
    md: 'p-3 text-sm',
    lg: 'p-4 text-base'
  };

  return (
    <div className={cn(
      'flex flex-col items-center space-y-2',
      sizeClasses[size]
    )}>
      <div className={cn(
        'rounded-full p-3',
        meta.bgColor
      )}>
        <Trophy className={cn(
          'h-6 w-6',
          meta.color
        )} />
      </div>
      <p className="font-medium text-gray-900">{meta.label}</p>
      <p className="text-xs text-gray-500">
        {formatDate(badge.earned_at, { 
          year: 'numeric',
          month: 'short',
          day: 'numeric'
        })}
      </p>
    </div>
  );
};

// Level Benefits Card Component
const LevelBenefitsCard: React.FC<LevelBenefitsCardProps> = ({ level }) => {
  const benefits = LEVEL_BENEFITS[level];
  const meta = LEVEL_META[level];

  return (
    <Card className="p-6">
      <div className="flex items-center space-x-3 mb-4">
        <Medal className={cn('h-6 w-6', meta.color)} />
        <h3 className="text-lg font-medium text-gray-900">
          Level Benefits
        </h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className={cn(
          'p-4 rounded-lg',
          meta.bgColor
        )}>
          <p className="text-sm font-medium text-gray-900">Monthly Bonus</p>
          <p className="mt-1 text-2xl font-semibold">
            {formatCurrency(benefits.bonus_credits)}
          </p>
        </div>

        <div className={cn(
          'p-4 rounded-lg',
          meta.bgColor
        )}>
          <p className="text-sm font-medium text-gray-900">Early Access</p>
          <p className="mt-1 text-2xl font-semibold">
            {benefits.early_access_minutes}m
          </p>
        </div>

        <div className={cn(
          'p-4 rounded-lg',
          meta.bgColor
        )}>
          <p className="text-sm font-medium text-gray-900">Entry Multiplier</p>
          <p className="mt-1 text-2xl font-semibold">
            {benefits.max_entries_multiplier}x
          </p>
        </div>
      </div>
    </Card>
  );
};

// Loyalty History Card Component
const LoyaltyHistoryCard: React.FC<LoyaltyHistoryCardProps> = ({ history }) => {
  if (!history.length) {
    return null;
  }

  return (
    <Card className="p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Level History</h3>
      <div className="space-y-4">
        {history.map((entry) => (
          <div
            key={entry.id}
            className="flex items-start space-x-3"
          >
            <div className="flex-shrink-0">
              <Clock className="h-5 w-5 text-gray-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-gray-900">
                Advanced from {LEVEL_META[entry.previous_level].label} to{' '}
                {LEVEL_META[entry.new_level].label}
              </p>
              {entry.reason && (
                <p className="mt-0.5 text-sm text-gray-500">{entry.reason}</p>
              )}
              <p className="mt-0.5 text-xs text-gray-400">
                {formatDate(entry.created_at)}
              </p>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};

// Main UserLoyalty Component
export const UserLoyalty: React.FC<UserLoyaltyProps> = ({
  userId,
  className
}) => {
  // TODO: Replace with actual loyalty store once implemented
  const isLoading = false;
  const error = null;
  const mockData = {
    currentLevel: UserLevel.SILVER,
    totalSpend: 350,
    totalEntries: 35,
    badges: [
      {
        type: BadgeType.FIRST_RAFFLE,
        earned_at: '2024-01-01T00:00:00Z',
        details: {}
      },
      {
        type: BadgeType.LOYAL_PLAYER,
        earned_at: '2024-02-01T00:00:00Z',
        details: {}
      }
    ] as LoyaltyBadge[],
    history: [
      {
        id: 1,
        user_id: userId,
        previous_level: UserLevel.BRONZE,
        new_level: UserLevel.SILVER,
        reason: 'Reached qualification requirements',
        created_at: '2024-02-01T00:00:00Z'
      }
    ] as LoyaltyHistory[]
  };

  // Calculate earned badges for progress tracking
  const earnedBadges = useMemo(() => 
    new Set(mockData.badges.map(badge => badge.type))
  , [mockData.badges]);

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="flex justify-center">
          <LoadingSpinner />
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-6">
        <div className="flex items-start space-x-3 text-red-600">
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          <p>{error}</p>
        </div>
      </Card>
    );
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Current Level & Progress */}
      <LevelProgressCard
        currentLevel={mockData.currentLevel}
        totalSpend={mockData.totalSpend}
        totalEntries={mockData.totalEntries}
        earnedBadges={earnedBadges}
      />

      {/* Level Benefits */}
      <LevelBenefitsCard level={mockData.currentLevel} />

      {/* Earned Badges */}
      <Card className="p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-6">
          Earned Badges
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {mockData.badges.map((badge) => (
            <BadgeDisplay
              key={`${badge.type}-${badge.earned_at}`}
              badge={badge}
            />
          ))}
        </div>
      </Card>

      {/* Level History */}
      <LoyaltyHistoryCard history={mockData.history} />
    </div>
  );
};

export default UserLoyalty;