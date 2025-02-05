#src/user_service/models/user_protection_settings.py

from datetime import datetime, timezone
from decimal import Decimal
from src.shared import db
from typing import Optional

class UserProtectionSettings(db.Model):
    """
    User protection settings for managing purchase limits and safety controls.
    
    Attributes:
        user_id: Primary key, foreign key to users table
        daily_max_tickets: Maximum tickets purchasable per day
        daily_spend_limit: Maximum spending allowed per day
        cool_down_minutes: Required wait time between purchases
        last_purchase_time: Timestamp of last purchase
        require_2fa_above: Amount threshold requiring 2FA
        updated_at: Last update timestamp
    """
    __tablename__ = 'user_protection_settings'
    
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), primary_key=True)
    daily_max_tickets = db.Column(db.Integer, nullable=False, default=50)
    daily_spend_limit = db.Column(db.Numeric(10, 2), nullable=False, default=100.00)
    cool_down_minutes = db.Column(db.Integer, nullable=False, default=0)
    last_purchase_time = db.Column(db.DateTime, nullable=True)
    require_2fa_above = db.Column(db.Numeric(10, 2), nullable=True)
    updated_at = db.Column(
        db.DateTime, 
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc)
    )

    # Relationship to User model
    user = db.relationship(
        'User',
        backref=db.backref('protection_settings', uselist=False, cascade='all, delete-orphan'),
        lazy='joined'
    )

    def to_dict(self) -> dict:
        """Convert settings to dictionary representation."""
        return {
            'daily_max_tickets': self.daily_max_tickets,
            'daily_spend_limit': float(self.daily_spend_limit),
            'cool_down_minutes': self.cool_down_minutes,
            'require_2fa_above': float(self.require_2fa_above) if self.require_2fa_above else None,
            'last_purchase_time': self.last_purchase_time.isoformat() if self.last_purchase_time else None,
            'updated_at': self.updated_at.isoformat()
        }