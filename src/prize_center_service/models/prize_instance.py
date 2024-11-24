from datetime import datetime, timezone
from src.shared import db
from enum import Enum

class InstanceStatus(Enum):
    AVAILABLE = "available"
    DISCOVERED = "discovered"
    CLAIMED = "claimed"
    EXPIRED = "expired"
    VOIDED = "voided"

class DrawWinDistributionType(Enum):
    SPLIT = "split"
    FULL = "full"

class PrizeInstance(db.Model):
    """Base model for prize instances"""
    __tablename__ = 'prize_instances'

    id = db.Column(db.Integer, primary_key=True)
    instance_id = db.Column(db.String(20), unique=True, nullable=False)
    pool_id = db.Column(db.Integer, db.ForeignKey('prize_pools.id'), nullable=False)
    template_id = db.Column(db.Integer, db.ForeignKey('prize_templates.id'), nullable=False)
    status = db.Column(db.Enum(InstanceStatus), nullable=False, default=InstanceStatus.AVAILABLE)
    individual_odds = db.Column(db.Float)
    retail_value = db.Column(db.Numeric(10, 2), nullable=False)
    cash_value = db.Column(db.Numeric(10, 2), nullable=False)
    credit_value = db.Column(db.Numeric(10, 2), nullable=False)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    created_by_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    
    # Discriminator column for instance type
    instance_type = db.Column(db.String(20))
    
    __mapper_args__ = {
        'polymorphic_identity': 'base',
        'polymorphic_on': instance_type
    }

class InstantWinInstance(PrizeInstance):
    """Instant win specific instance"""
    __mapper_args__ = {
        'polymorphic_identity': 'instant_win'
    }

    collective_odds = db.Column(db.Float)

class DrawWinInstance(PrizeInstance):
    """Draw win specific instance"""
    __mapper_args__ = {
        'polymorphic_identity': 'draw_win'
    }

    distribution_type = db.Column(db.Enum(DrawWinDistributionType))
    draw_number = db.Column(db.Integer)
    draw_reference = db.Column(db.String(50))