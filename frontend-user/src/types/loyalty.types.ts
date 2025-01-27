// src/types/loyalty.types.ts
export enum UserLevel {
    NEWBIE = "newbie",
    BRONZE = "bronze",
    SILVER = "silver",
    GOLD = "gold",
    PLATINUM = "platinum"
  }
  
  export type LoyaltyBadge = string;
  
  export interface LoyaltyStatus {
    level: UserLevel;
    badges: LoyaltyBadge[];
    total_entries: number;
    total_spend: number;
    streak_days: number;
    benefits: LevelBenefits;
    last_activity: string;
  }
  
  export interface LevelBenefits {
    bonus_credits: number;
    early_access_minutes: number;
    max_entries_multiplier: number;
  }