"""Prize Pool Management Module

This module implements the core prize pool functionality with proper relationship handling,
state management, and integration points with the raffle system.

Relationships are carefully managed to handle the bidirectional nature of pool-raffle
connections while maintaining referential integrity and avoiding circular dependencies.
"""

from datetime import datetime, timezone
from decimal import Decimal
from enum import Enum
from typing import List, Optional, Dict, Any
from src.shared import db
from .prize_instance import PrizeInstance, InstantWinInstance, DrawWinInstance

class PoolStatus(str, Enum):
    """Prize pool status states with string value support"""
    UNLOCKED = "unlocked"
    LOCKED = "locked"
    USED = "used"

    def __str__(self) -> str:
        return self.value

class PrizePool(db.Model):
    """Prize pool management with comprehensive state handling and raffle integration"""
    __tablename__ = 'prize_pools'

    # Primary fields
    id: int = db.Column(db.Integer, primary_key=True)
    name: str = db.Column(db.String(100), nullable=False, unique=True)
    description: Optional[str] = db.Column(db.Text)
    status: PoolStatus = db.Column(
        db.Enum(PoolStatus),
        nullable=False,
        default=PoolStatus.UNLOCKED
    )

    # Instance tracking
    total_instances: int = db.Column(db.Integer, default=0)
    instant_win_instances: int = db.Column(db.Integer, default=0)
    draw_win_instances: int = db.Column(db.Integer, default=0)

    # Value tracking
    retail_total: Decimal = db.Column(db.Numeric(12, 2), default=0)
    cash_total: Decimal = db.Column(db.Numeric(12, 2), default=0)
    credit_total: Decimal = db.Column(db.Numeric(12, 2), default=0)
    total_odds: float = db.Column(db.Float, default=0)

    # Metadata
    locked_at: Optional[datetime] = db.Column(db.DateTime)
    locked_by_id: Optional[int] = db.Column(db.Integer, db.ForeignKey('users.id'))
    created_at: datetime = db.Column(
        db.DateTime, 
        default=lambda: datetime.now(timezone.utc)
    )
    created_by_id: int = db.Column(
        db.Integer,
        db.ForeignKey('users.id'),
        nullable=False
    )

    # Raffle relationship management
    current_raffle_id: Optional[int] = db.Column(
        db.Integer,
        db.ForeignKey('raffles.id'),
        nullable=True
    )

    # Relationships with explicit foreign keys
    current_raffle = db.relationship(
        'Raffle',
        foreign_keys=[current_raffle_id],
        backref=db.backref(
            'active_prize_pool',
            uselist=False,
            foreign_keys=[current_raffle_id]
        )
    )

    raffles = db.relationship(
        'Raffle',
        primaryjoin="Raffle.prize_pool_id == PrizePool.id",
        back_populates='prize_pool',
        overlaps="active_prize_pool"
    )

    # Prize instance management
    instances = db.relationship(
        'PrizeInstance',
        back_populates='pool',
        lazy='dynamic',
        cascade='all, delete-orphan'
    )

    def get_next_draw_instance(self) -> Optional[DrawWinInstance]:
        """
        Get next available draw win instance.
        
        Returns:
            Optional[DrawWinInstance]: Next available draw instance or None
        """
        return self.instances.filter_by(
            instance_type='draw_win',
            status='available'
        ).first()

    def get_available_instant_wins(self) -> List[InstantWinInstance]:
        """
        Get all available instant win instances.
        
        Returns:
            List[InstantWinInstance]: List of available instant win instances
        """
        return self.instances.filter_by(
            instance_type='instant_win',
            status='available'
        ).all()

    def get_instances_by_type(self, instance_type: str) -> List[PrizeInstance]:
        """
        Get all instances of specified type.
        
        Args:
            instance_type: Type of instances to retrieve
            
        Returns:
            List[PrizeInstance]: List of matching instances
        """
        return self.instances.filter_by(instance_type=instance_type).all()

    def can_modify(self) -> bool:
        """
        Check if pool can be modified.
        
        Returns:
            bool: True if pool is in modifiable state
        """
        return self.status == PoolStatus.UNLOCKED

    def validate_for_lock(self) -> List[str]:
        """
        Validate pool can be locked.
        
        Returns:
            List[str]: List of validation error messages, empty if valid
        """
        errors: List[str] = []
        if self.total_instances == 0:
            errors.append("Pool must have at least one instance")
        if self.draw_win_instances == 0:
            errors.append("Pool must have at least one draw win instance")
        if not (99.9 <= self.total_odds <= 100.1):
            errors.append("Total odds must equal 100%")
        return errors

    def update_totals(self, instances: List[PrizeInstance]) -> None:
        """
        Update pool totals based on new instances.
        
        Args:
            instances: List of instances to include in totals
        """
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
        """
        Verify pool is compatible with raffle usage.
        
        Returns:
            bool: True if pool can be used with raffles
        """
        return (
            self.status == PoolStatus.LOCKED and
            self.draw_win_instances > 0
        )

    def to_dict(self) -> Dict[str, Any]:
        """
        Convert pool to dictionary representation.
        
        Returns:
            Dict[str, Any]: Dictionary containing pool data
        """
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