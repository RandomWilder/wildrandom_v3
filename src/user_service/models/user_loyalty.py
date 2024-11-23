# src/user_service/models/user_loyalty.py

from datetime import datetime, timezone
from src.shared import db
from src.user_service.config.loyalty_config import UserLevel, BadgeType
import json

class UserLoyalty(db.Model):
    """Track user loyalty status"""
    __tablename__ = 'user_loyalty'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False, unique=True)
    current_level = db.Column(db.String(20), nullable=False, default=UserLevel.NEWBIE.value)
    badges = db.Column(db.JSON, nullable=False, default=list)  # List of earned badges
    total_entries = db.Column(db.Integer, default=0)
    total_spend = db.Column(db.Float, default=0.0)
    last_activity = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    streak_days = db.Column(db.Integer, default=0)
    level_updated_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    
    def add_badge(self, badge_type: BadgeType, details: dict = None):
        """Add a new badge"""
        current_badges = self.badges or []
        badge_entry = {
            "type": badge_type.value,
            "earned_at": datetime.now(timezone.utc).isoformat(),
            "details": details or {}
        }
        current_badges.append(badge_entry)
        self.badges = current_badges

    def has_badge(self, badge_type: BadgeType) -> bool:
        """Check if user has specific badge"""
        if not self.badges:
            return False
        return any(b["type"] == badge_type.value for b in self.badges)

    def get_active_benefits(self) -> dict:
        """Get current level benefits"""
        from src.user_service.config.loyalty_config import LoyaltyConfig
        return LoyaltyConfig.get_level_benefits(UserLevel(self.current_level))

class LoyaltyHistory(db.Model):
    """Track loyalty level changes"""
    __tablename__ = 'loyalty_history'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    previous_level = db.Column(db.String(20), nullable=False)
    new_level = db.Column(db.String(20), nullable=False)
    reason = db.Column(db.String(255))
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))