/**
 * Loyalty System Types
 * Mirrors Python backend loyalty_config.py and related models
 */

/**
 * Core Enums
 */
export enum UserLevel {
    NEWBIE = 'newbie',
    BRONZE = 'bronze',
    SILVER = 'silver',
    GOLD = 'gold',
    PLATINUM = 'platinum'
  }
  
  export enum BadgeType {
    // Achievement Badges
    FIRST_RAFFLE = 'first_raffle',
    FIRST_WIN = 'first_win',
    EARLY_BIRD = 'early_bird',
    BIG_SPENDER = 'big_spender',
    LOYAL_PLAYER = 'loyal_player',
  
    // Milestone Badges
    ENTRIES_10 = 'entries_10',
    ENTRIES_50 = 'entries_50',
    ENTRIES_100 = 'entries_100',
    WINS_5 = 'wins_5',
    WINS_10 = 'wins_10',
  
    // Special Badges
    STREAK_7 = 'weekly_streak',
    STREAK_30 = 'monthly_streak',
    VIP_EVENT = 'vip_event'
  }
  
  /**
   * Level Configuration Types
   */
  export interface LevelRequirement {
    min_entries: number;
    min_spend: number;
    required_badges: Set<BadgeType>;
  }
  
  export interface LevelBenefits {
    bonus_credits: number;
    early_access_minutes: number;
    max_entries_multiplier: number;
  }
  
  /**
   * Badge Configuration Types
   */
  export interface BadgeRequirement {
    entries?: number;
    early_entries?: number;
    single_purchase?: number;
    days_active?: number;
    min_entries?: number;
    consecutive_days?: number;
    one_time: boolean;
  }
  
  /**
   * Time Window Configuration
   */
  export interface TimeWindows {
    level_assessment: number;   // days
    streak_break: number;       // days
    activity_tracking: number;  // days
  }
  
  /**
   * Core Models
   */
  export interface UserLoyalty {
    id: number;
    user_id: number;
    current_level: UserLevel;
    badges: LoyaltyBadge[];
    total_entries: number;
    total_spend: number;
    last_activity: string | null;
    streak_days: number;
    level_updated_at: string;
  }
  
  export interface LoyaltyBadge {
    type: BadgeType;
    earned_at: string;
    details: Record<string, any>;
  }
  
  export interface LoyaltyHistory {
    id: number;
    user_id: number;
    previous_level: UserLevel;
    new_level: UserLevel;
    reason: string;
    created_at: string;
  }
  
  /**
   * Configuration Constants
   * Mirrors Python LoyaltyConfig class
   */
  export const LEVEL_REQUIREMENTS: Record<UserLevel, LevelRequirement> = {
    [UserLevel.NEWBIE]: {
      min_entries: 0,
      min_spend: 0,
      required_badges: new Set()
    },
    [UserLevel.BRONZE]: {
      min_entries: 5,
      min_spend: 50,
      required_badges: new Set([BadgeType.FIRST_RAFFLE])
    },
    [UserLevel.SILVER]: {
      min_entries: 20,
      min_spend: 200,
      required_badges: new Set([BadgeType.LOYAL_PLAYER])
    },
    [UserLevel.GOLD]: {
      min_entries: 50,
      min_spend: 500,
      required_badges: new Set([BadgeType.STREAK_7])
    },
    [UserLevel.PLATINUM]: {
      min_entries: 100,
      min_spend: 1000,
      required_badges: new Set([BadgeType.STREAK_30])
    }
  };
  
  export const LEVEL_BENEFITS: Record<UserLevel, LevelBenefits> = {
    [UserLevel.NEWBIE]: {
      bonus_credits: 0,
      early_access_minutes: 0,
      max_entries_multiplier: 1.0
    },
    [UserLevel.BRONZE]: {
      bonus_credits: 5,
      early_access_minutes: 10,
      max_entries_multiplier: 1.2
    },
    [UserLevel.SILVER]: {
      bonus_credits: 15,
      early_access_minutes: 20,
      max_entries_multiplier: 1.5
    },
    [UserLevel.GOLD]: {
      bonus_credits: 30,
      early_access_minutes: 30,
      max_entries_multiplier: 2.0
    },
    [UserLevel.PLATINUM]: {
      bonus_credits: 50,
      early_access_minutes: 60,
      max_entries_multiplier: 3.0
    }
  };
  
  /**
   * UI Metadata
   */
  export const LEVEL_META: Record<UserLevel, {
    label: string;
    color: string;
    bgColor: string;
    icon: string;
  }> = {
    [UserLevel.NEWBIE]: {
      label: 'Newbie',
      color: 'text-gray-700',
      bgColor: 'bg-gray-50',
      icon: 'user'
    },
    [UserLevel.BRONZE]: {
      label: 'Bronze',
      color: 'text-amber-700',
      bgColor: 'bg-amber-50',
      icon: 'award'
    },
    [UserLevel.SILVER]: {
      label: 'Silver',
      color: 'text-gray-700',
      bgColor: 'bg-gray-100',
      icon: 'award'
    },
    [UserLevel.GOLD]: {
      label: 'Gold',
      color: 'text-yellow-700',
      bgColor: 'bg-yellow-50',
      icon: 'award'
    },
    [UserLevel.PLATINUM]: {
      label: 'Platinum',
      color: 'text-indigo-700',
      bgColor: 'bg-indigo-50',
      icon: 'crown'
    }
  };
  
  export const BADGE_META: Record<BadgeType, {
    label: string;
    description: string;
    icon: string;
    color: string;
    bgColor: string;
  }> = {
    // Achievement Badges
    [BadgeType.FIRST_RAFFLE]: {
      label: 'First Raffle',
      description: 'Participated in first raffle',
      icon: 'star',
      color: 'text-blue-700',
      bgColor: 'bg-blue-50'
    },
    [BadgeType.FIRST_WIN]: {
      label: 'First Win',
      description: 'Won first prize',
      icon: 'trophy',
      color: 'text-yellow-700',
      bgColor: 'bg-yellow-50'
    },
    [BadgeType.EARLY_BIRD]: {
      label: 'Early Bird',
      description: 'Among first 10 entries in a raffle',
      icon: 'sunrise',
      color: 'text-orange-700',
      bgColor: 'bg-orange-50'
    },
    [BadgeType.BIG_SPENDER]: {
      label: 'Big Spender',
      description: 'Made a large single purchase',
      icon: 'shopping-bag',
      color: 'text-green-700',
      bgColor: 'bg-green-50'
    },
    [BadgeType.LOYAL_PLAYER]: {
      label: 'Loyal Player',
      description: 'Consistent participation over time',
      icon: 'heart',
      color: 'text-red-700',
      bgColor: 'bg-red-50'
    },
  
    // Milestone Badges
    [BadgeType.ENTRIES_10]: {
      label: '10 Entries',
      description: 'Reached 10 raffle entries',
      icon: 'milestone',
      color: 'text-blue-700',
      bgColor: 'bg-blue-50'
    },
    [BadgeType.ENTRIES_50]: {
      label: '50 Entries',
      description: 'Reached 50 raffle entries',
      icon: 'milestone',
      color: 'text-indigo-700',
      bgColor: 'bg-indigo-50'
    },
    [BadgeType.ENTRIES_100]: {
      label: '100 Entries',
      description: 'Reached 100 raffle entries',
      icon: 'milestone',
      color: 'text-violet-700',
      bgColor: 'bg-violet-50'
    },
    [BadgeType.WINS_5]: {
      label: '5 Wins',
      description: 'Won 5 prizes',
      icon: 'award',
      color: 'text-amber-700',
      bgColor: 'bg-amber-50'
    },
    [BadgeType.WINS_10]: {
      label: '10 Wins',
      description: 'Won 10 prizes',
      icon: 'award',
      color: 'text-yellow-700',
      bgColor: 'bg-yellow-50'
    },
  
    // Special Badges
    [BadgeType.STREAK_7]: {
      label: 'Weekly Streak',
      description: '7 days consecutive activity',
      icon: 'flame',
      color: 'text-orange-700',
      bgColor: 'bg-orange-50'
    },
    [BadgeType.STREAK_30]: {
      label: 'Monthly Streak',
      description: '30 days consecutive activity',
      icon: 'zap',
      color: 'text-amber-700',
      bgColor: 'bg-amber-50'
    },
    [BadgeType.VIP_EVENT]: {
      label: 'VIP Event',
      description: 'Participated in VIP raffle',
      icon: 'crown',
      color: 'text-purple-700',
      bgColor: 'bg-purple-50'
    }
  };