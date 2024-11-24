from datetime import datetime, timezone
from src.shared import db
from enum import Enum

class PoolStatus(Enum):
    UNLOCKED = "unlocked"
    LOCKED = "locked"
    USED = "used"

class PrizePool(db.Model):
    """Collection of prize instances"""
    __tablename__ = 'prize_pools'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False, unique=True)
    description = db.Column(db.Text)
    status = db.Column(db.Enum(PoolStatus), nullable=False, default=PoolStatus.UNLOCKED)
    total_instances = db.Column(db.Integer, default=0)
    instant_win_instances = db.Column(db.Integer, default=0)
    draw_win_instances = db.Column(db.Integer, default=0)
    retail_total = db.Column(db.Numeric(12, 2), default=0)
    cash_total = db.Column(db.Numeric(12, 2), default=0)
    credit_total = db.Column(db.Numeric(12, 2), default=0)
    total_odds = db.Column(db.Float, default=0)
    locked_at = db.Column(db.DateTime)
    locked_by_id = db.Column(db.Integer, db.ForeignKey('users.id'))
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    created_by_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)

    def can_modify(self):
        """Check if pool can be modified"""
        return self.status == PoolStatus.UNLOCKED

    def validate_for_lock(self):
        """Validate pool can be locked"""
        errors = []
        if self.total_instances == 0:
            errors.append("Pool must have at least one instance")
        if self.draw_win_instances == 0:
            errors.append("Pool must have at least one draw win instance")
        if not (99.9 <= self.total_odds <= 100.1):  # Allow small floating point variance
            errors.append("Total odds must equal 100%")
        return errors

    def to_dict(self):
        """Convert pool to dictionary"""
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'status': self.status.value,
            'total_instances': self.total_instances,
            'instant_win_instances': self.instant_win_instances,
            'draw_win_instances': self.draw_win_instances,
            'values': {
                'retail_total': float(self.retail_total),
                'cash_total': float(self.cash_total),
                'credit_total': float(self.credit_total)
            },
            'total_odds': self.total_odds,
            'locked_at': self.locked_at.isoformat() if self.locked_at else None,
            'created_at': self.created_at.isoformat()
        }