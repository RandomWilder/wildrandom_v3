# src/user_service/config/loyalty_config.py

from enum import Enum
from typing import Dict, List, Set

class UserLevel(Enum):
    NEWBIE = "newbie"
    BRONZE = "bronze"
    SILVER = "silver"
    GOLD = "gold"
    PLATINUM = "platinum"

class BadgeType(Enum):
    # Achievement Badges
    FIRST_RAFFLE = "first_raffle"
    FIRST_WIN = "first_win"
    EARLY_BIRD = "early_bird"      # First 10 entries in a raffle
    BIG_SPENDER = "big_spender"    # Single large purchase
    LOYAL_PLAYER = "loyal_player"  # Consistent participation
    
    # Milestone Badges
    ENTRIES_10 = "entries_10"
    ENTRIES_50 = "entries_50"
    ENTRIES_100 = "entries_100"
    WINS_5 = "wins_5"
    WINS_10 = "wins_10"
    
    # Special Badges
    STREAK_7 = "weekly_streak"     # 7 days consecutive activity
    STREAK_30 = "monthly_streak"   # 30 days consecutive activity
    VIP_EVENT = "vip_event"        # Participated in VIP raffle

class LoyaltyConfig:
    """Centralized configuration for loyalty system"""
    
    # Level Requirements (past 30 days)
    LEVEL_REQUIREMENTS = {
        UserLevel.NEWBIE: {
            "min_entries": 0,
            "min_spend": 0,
            "required_badges": set()
        },
        UserLevel.BRONZE: {
            "min_entries": 5,
            "min_spend": 50,
            "required_badges": {BadgeType.FIRST_RAFFLE}
        },
        UserLevel.SILVER: {
            "min_entries": 20,
            "min_spend": 200,
            "required_badges": {BadgeType.LOYAL_PLAYER}
        },
        UserLevel.GOLD: {
            "min_entries": 50,
            "min_spend": 500,
            "required_badges": {BadgeType.STREAK_7}
        },
        UserLevel.PLATINUM: {
            "min_entries": 100,
            "min_spend": 1000,
            "required_badges": {BadgeType.STREAK_30}
        }
    }

    # Level Benefits
    LEVEL_BENEFITS = {
        UserLevel.NEWBIE: {
            "bonus_credits": 0,
            "early_access_minutes": 0,
            "max_entries_multiplier": 1.0
        },
        UserLevel.BRONZE: {
            "bonus_credits": 5,          # Monthly bonus credits
            "early_access_minutes": 10,   # Early access to new raffles
            "max_entries_multiplier": 1.2 # Can buy 20% more entries
        },
        UserLevel.SILVER: {
            "bonus_credits": 15,
            "early_access_minutes": 20,
            "max_entries_multiplier": 1.5
        },
        UserLevel.GOLD: {
            "bonus_credits": 30,
            "early_access_minutes": 30,
            "max_entries_multiplier": 2.0
        },
        UserLevel.PLATINUM: {
            "bonus_credits": 50,
            "early_access_minutes": 60,
            "max_entries_multiplier": 3.0
        }
    }

    # Badge Requirements
    BADGE_REQUIREMENTS = {
        BadgeType.FIRST_RAFFLE: {
            "entries": 1,
            "one_time": True
        },
        BadgeType.EARLY_BIRD: {
            "early_entries": 10,
            "one_time": False
        },
        BadgeType.BIG_SPENDER: {
            "single_purchase": 100,
            "one_time": False
        },
        BadgeType.LOYAL_PLAYER: {
            "days_active": 14,
            "min_entries": 20,
            "one_time": True
        },
        BadgeType.STREAK_7: {
            "consecutive_days": 7,
            "one_time": False
        },
        BadgeType.STREAK_30: {
            "consecutive_days": 30,
            "one_time": False
        }
    }

    # Time Windows (in days)
    TIME_WINDOWS = {
        "level_assessment": 30,      # Look back period for level calculation
        "streak_break": 2,           # Allowed gap in streak before breaking
        "activity_tracking": 90      # How long to keep detailed activity
    }

    @staticmethod
    def get_level_requirements(level: UserLevel) -> Dict:
        """Get requirements for a specific level"""
        return LoyaltyConfig.LEVEL_REQUIREMENTS.get(level, {})

    @staticmethod
    def get_level_benefits(level: UserLevel) -> Dict:
        """Get benefits for a specific level"""
        return LoyaltyConfig.LEVEL_BENEFITS.get(level, {})

    @staticmethod
    def get_badge_requirements(badge: BadgeType) -> Dict:
        """Get requirements for a specific badge"""
        return LoyaltyConfig.BADGE_REQUIREMENTS.get(badge, {})