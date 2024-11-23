# src/user_service/services/loyalty_service.py

from datetime import datetime, timezone, timedelta
from typing import Tuple, Optional, List, Dict
from sqlalchemy.exc import SQLAlchemyError
from src.shared import db
from src.user_service.models.user_loyalty import UserLoyalty, LoyaltyHistory
from src.user_service.config.loyalty_config import UserLevel, BadgeType, LoyaltyConfig
import logging

logger = logging.getLogger(__name__)

class LoyaltyService:
    @staticmethod
    def get_user_loyalty(user_id: int) -> Tuple[Optional[UserLoyalty], Optional[str]]:
        """Get or create user loyalty record"""
        try:
            loyalty = UserLoyalty.query.filter_by(user_id=user_id).first()
            if not loyalty:
                loyalty = UserLoyalty(user_id=user_id)
                db.session.add(loyalty)
                db.session.commit()
            return loyalty, None
        except SQLAlchemyError as e:
            logger.error(f"Database error in get_user_loyalty: {str(e)}")
            return None, str(e)

    @staticmethod
    def evaluate_level(user_id: int) -> Tuple[Optional[UserLevel], Optional[str]]:
        """Evaluate user's level based on recent activity"""
        try:
            loyalty, error = LoyaltyService.get_user_loyalty(user_id)
            if error:
                return None, error

            # Get activity window
            window_start = datetime.now(timezone.utc) - timedelta(
                days=LoyaltyConfig.TIME_WINDOWS['level_assessment']
            )

            # Get recent activity metrics (this will be integrated with raffle service)
            # For now, using stored totals
            recent_entries = loyalty.total_entries
            recent_spend = loyalty.total_spend
            current_level = UserLevel(loyalty.current_level)

            # Evaluate each level from highest to lowest
            for level in reversed(list(UserLevel)):
                requirements = LoyaltyConfig.get_level_requirements(level)
                
                if (recent_entries >= requirements['min_entries'] and
                    recent_spend >= requirements['min_spend'] and
                    all(loyalty.has_badge(badge) for badge in requirements['required_badges'])):
                    
                    if level != current_level:
                        LoyaltyService._update_user_level(
                            user_id=user_id,
                            previous_level=current_level,
                            new_level=level,
                            reason="Periodic level evaluation"
                        )
                    return level, None

            return current_level, None

        except Exception as e:
            logger.error(f"Error evaluating level: {str(e)}")
            return None, str(e)

    @staticmethod
    def _update_user_level(
        user_id: int,
        previous_level: UserLevel,
        new_level: UserLevel,
        reason: str
    ) -> Tuple[bool, Optional[str]]:
        """Update user's loyalty level"""
        try:
            loyalty = UserLoyalty.query.filter_by(user_id=user_id).first()
            if not loyalty:
                return False, "User loyalty record not found"

            loyalty.current_level = new_level.value
            loyalty.level_updated_at = datetime.now(timezone.utc)

            # Record level change
            history = LoyaltyHistory(
                user_id=user_id,
                previous_level=previous_level.value,
                new_level=new_level.value,
                reason=reason
            )
            
            db.session.add(history)
            db.session.commit()

            return True, None

        except SQLAlchemyError as e:
            db.session.rollback()
            logger.error(f"Database error in update_user_level: {str(e)}")
            return False, str(e)

    @staticmethod
    def check_and_award_badges(user_id: int) -> Tuple[List[BadgeType], Optional[str]]:
        """Check and award any newly earned badges"""
        try:
            loyalty, error = LoyaltyService.get_user_loyalty(user_id)
            if error:
                return [], error

            new_badges = []

            for badge_type in BadgeType:
                requirements = LoyaltyConfig.get_badge_requirements(badge_type)
                
                # Skip if one-time badge already earned
                if requirements['one_time'] and loyalty.has_badge(badge_type):
                    continue

                # Check requirements (integrate with actual metrics later)
                if badge_type == BadgeType.FIRST_RAFFLE and loyalty.total_entries >= 1:
                    loyalty.add_badge(badge_type)
                    new_badges.append(badge_type)
                
                elif badge_type == BadgeType.STREAK_7 and loyalty.streak_days >= 7:
                    loyalty.add_badge(badge_type)
                    new_badges.append(badge_type)
                
                # Add more badge checks here

            if new_badges:
                db.session.commit()

            return new_badges, None

        except SQLAlchemyError as e:
            db.session.rollback()
            logger.error(f"Database error in check_and_award_badges: {str(e)}")
            return [], str(e)

    @staticmethod
    def update_activity(user_id: int, activity_type: str, amount: float = 0) -> Tuple[bool, Optional[str]]:
        """Update user activity metrics"""
        try:
            loyalty, error = LoyaltyService.get_user_loyalty(user_id)
            if error:
                return False, error

            # Update relevant metrics based on activity type
            if activity_type == 'raffle_entry':
                loyalty.total_entries += 1
                loyalty.total_spend += amount
            
            # Update last activity and streak
            now = datetime.now(timezone.utc)
            if loyalty.last_activity:
                days_diff = (now - loyalty.last_activity).days
                if days_diff <= LoyaltyConfig.TIME_WINDOWS['streak_break']:
                    loyalty.streak_days += 1
                else:
                    loyalty.streak_days = 1
            else:
                loyalty.streak_days = 1

            loyalty.last_activity = now
            
            db.session.commit()
            
            # Check for new badges
            LoyaltyService.check_and_award_badges(user_id)
            
            # Re-evaluate level
            LoyaltyService.evaluate_level(user_id)
            
            return True, None

        except SQLAlchemyError as e:
            db.session.rollback()
            logger.error(f"Database error in update_activity: {str(e)}")
            return False, str(e)