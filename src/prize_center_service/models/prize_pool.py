# src/prize_center_service/models/prize_pool.py

from datetime import datetime, timezone
from src.shared import db
from enum import Enum
from decimal import Decimal
from typing import List, Optional
from .prize_instance import PrizeInstance, InstantWinInstance, DrawWinInstance

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

    # Relationships
    instances = db.relationship('PrizeInstance', 
                              back_populates='pool',
                              lazy='dynamic',
                              cascade='all, delete-orphan')

    # Raffle Service Integration Methods
    def get_next_draw_instance(self) -> Optional[DrawWinInstance]:
        """Get next available draw win instance"""
        return self.instances.filter_by(
            instance_type='draw_win',
            status='available'
        ).first()

    def get_available_instant_wins(self) -> List[InstantWinInstance]:
        """Get all available instant win instances"""
        return self.instances.filter_by(
            instance_type='instant_win',
            status='available'
        ).all()

    def get_instances_by_type(self, instance_type: str) -> List[PrizeInstance]:
        """Get all instances of specified type"""
        return self.instances.filter_by(instance_type=instance_type).all()

    def can_modify(self) -> bool:
        """Check if pool can be modified"""
        return self.status == PoolStatus.UNLOCKED

    def validate_for_lock(self) -> List[str]:
        """Validate pool can be locked"""
        errors = []
        if self.total_instances == 0:
            errors.append("Pool must have at least one instance")
        if self.draw_win_instances == 0:
            errors.append("Pool must have at least one draw win instance")
        if not (99.9 <= self.total_odds <= 100.1):  # Allow small floating point variance
            errors.append("Total odds must equal 100%")
        return errors

    def update_totals(self, instances: List[PrizeInstance]) -> None:
        """Update pool totals based on new instances"""
        self.total_instances += len(instances)
        
        for instance in instances:
            if isinstance(instance, InstantWinInstance):
                self.instant_win_instances += 1
                if hasattr(instance, 'individual_odds'):
                    self.total_odds += instance.individual_odds
            elif isinstance(instance, DrawWinInstance):
                self.draw_win_instances += 1
                
            self.retail_total += instance.retail_value
            self.cash_total += instance.cash_value
            self.credit_total += instance.credit_value

    def verify_raffle_compatibility(self) -> bool:
        """Verify pool is compatible with raffle usage"""
        return (
            self.status == PoolStatus.LOCKED and
            self.draw_win_instances > 0
        )

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

# Update the __init__.py for prize_center_service models