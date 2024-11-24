from datetime import datetime, timezone
from src.shared import db
from enum import Enum
from decimal import Decimal

class PrizeType(Enum):
    INSTANT_WIN = "instant_win"
    DRAW_WIN = "draw_win"

class PrizeTier(Enum):
    PLATINUM = "platinum"
    GOLD = "gold"
    SILVER = "silver"
    BRONZE = "bronze"

class PrizeTemplate(db.Model):
    """Base configuration for prizes"""
    __tablename__ = 'prize_templates'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    type = db.Column(db.Enum(PrizeType), nullable=False)
    tier = db.Column(db.Enum(PrizeTier), nullable=False)
    retail_value = db.Column(db.Numeric(10, 2), nullable=False)
    cash_value = db.Column(db.Numeric(10, 2), nullable=False)
    credit_value = db.Column(db.Numeric(10, 2), nullable=False)
    total_instances = db.Column(db.Integer, default=0)
    pools_count = db.Column(db.Integer, default=0)
    instances_claimed = db.Column(db.Integer, default=0)
    is_deleted = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    created_by_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    updated_at = db.Column(db.DateTime, onupdate=lambda: datetime.now(timezone.utc))

    def __init__(self, **kwargs):
        super(PrizeTemplate, self).__init__(**kwargs)
        self.validate()

    def validate(self):
        """Validate template data"""
        if any(v < 0 for v in [self.retail_value, self.cash_value, self.credit_value]):
            raise ValueError("All values must be positive")

    def to_dict(self):
        """Convert template to dictionary"""
        return {
            'id': self.id,
            'name': self.name,
            'type': self.type.value,
            'tier': self.tier.value,
            'values': {
                'retail': float(self.retail_value),
                'cash': float(self.cash_value),
                'credit': float(self.credit_value)
            },
            'total_instances': self.total_instances,
            'pools_count': self.pools_count,
            'instances_claimed': self.instances_claimed,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }