# src/prize_center_service/models/prize_instance.py

"""
Prize Instance Models

Implements core prize instance functionality with comprehensive state management,
validation rules, and business logic for different prize types.
"""

from datetime import datetime, timezone
from decimal import Decimal
from typing import Optional, Dict, Any, Union
from src.shared import db
from enum import Enum
from sqlalchemy.orm import joinedload
import logging

logger = logging.getLogger(__name__)

class InstanceStatus(str, Enum):
    """Prize instance status states matching database enum"""
    AVAILABLE = "AVAILABLE"
    DISCOVERED = "DISCOVERED"
    CLAIMED = "CLAIMED"
    EXPIRED = "EXPIRED"
    VOIDED = "VOIDED"

    def __str__(self) -> str:
        return self.value

class DrawWinDistributionType(str, Enum):
    """Prize distribution types for draw-win instances"""
    SPLIT = "SPLIT"  # Value split among winners
    FULL = "FULL"    # Each winner gets full value

class PrizeInstance(db.Model):
    """Base model for prize instances"""
    __tablename__ = 'prize_instances'
    
    # Primary fields
    id = db.Column(db.Integer, primary_key=True)
    instance_id = db.Column(db.String(20), unique=True, nullable=False)
    pool_id = db.Column(db.Integer, db.ForeignKey('prize_pools.id'), nullable=False)
    template_id = db.Column(db.Integer, db.ForeignKey('prize_templates.id'), nullable=False)
    
    # State and value tracking
    status = db.Column(db.Enum(InstanceStatus), nullable=False, default=InstanceStatus.AVAILABLE)
    retail_value = db.Column(db.Numeric(10, 2), nullable=False)
    cash_value = db.Column(db.Numeric(10, 2), nullable=False)
    credit_value = db.Column(db.Numeric(10, 2), nullable=False)
    
    # Metadata and claim tracking
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    created_by_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    instance_type = db.Column(db.String(20))
    discovering_ticket_id = db.Column(db.String(20), nullable=True)
    discovery_time = db.Column(db.DateTime, nullable=True)
    
    # Claim tracking
    claimed_at = db.Column(db.DateTime, nullable=True)
    claimed_by_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    claim_transaction_id = db.Column(db.Integer, nullable=True)
    claim_meta = db.Column(db.JSON, nullable=True)  # Renamed from metadata to claim_meta


    # Relationships
    pool = db.relationship('PrizePool', back_populates='instances', foreign_keys=[pool_id])
    template = db.relationship('PrizeTemplate', back_populates='instances')
    claimed_by = db.relationship('User', foreign_keys=[claimed_by_id], backref='claimed_prizes')
    
    __mapper_args__ = {
        'polymorphic_identity': 'base',
        'polymorphic_on': instance_type
    }

    def record_discovery(self, ticket_id: str) -> None:
        """
        Record prize discovery details
        
        Args:
            ticket_id: ID of discovering ticket
        """
        self.status = InstanceStatus.DISCOVERED
        self.discovering_ticket_id = ticket_id
        self.discovery_time = datetime.now(timezone.utc)
        logger.info(f"Prize {self.instance_id} discovered with ticket {ticket_id}")

    def validate_claim_eligibility(self, user_id: int) -> Optional[str]:
        """
        Validate if user can claim prize
        
        Args:
            user_id: ID of user attempting claim
            
        Returns:
            Optional[str]: Error message if validation fails
        """
        from src.raffle_service.models import Ticket, Raffle
        
        logger.debug(f"Validating claim eligibility for prize {self.instance_id}")

        if self.status != InstanceStatus.DISCOVERED:
            logger.warning(f"Invalid prize state for claim: {self.status}")
            return f"Prize must be in DISCOVERED state to claim. Current state: {self.status}"

        if not self.discovering_ticket_id:
            logger.error(f"No discovery information found for prize {self.instance_id}")
            return "No discovery information found"

        # Get the raffle through prize pool relationship
        pool = db.session.query(self.pool).options(
            joinedload('raffles')
        ).filter_by(id=self.pool_id).first()
        
        if not pool or not pool.raffles:
            logger.error(f"No raffle found for prize pool {self.pool_id}")
            return "Prize pool not associated with raffle"

        # Get the active raffle
        raffle = next((r for r in pool.raffles if r.status == 'ACTIVE'), None)
        if not raffle:
            logger.error(f"No active raffle found for prize pool {self.pool_id}")
            return "No active raffle found"

        # Verify ticket ownership
        ticket = Ticket.query.filter_by(
            ticket_id=self.discovering_ticket_id,
            raffle_id=raffle.id,
            user_id=user_id,
            status='revealed'
        ).first()

        if not ticket:
            logger.warning(f"Ticket ownership verification failed for user {user_id}")
            return "Not authorized to claim this prize"

        logger.info(f"Claim eligibility validated for prize {self.instance_id}")
        return None

    def record_claim(self, user_id: int, transaction_id: int, value_type: str) -> None:
        """
        Record prize claim details
        
        Args:
            user_id: ID of claiming user
            transaction_id: ID of claim transaction
            value_type: Type of value claimed (credit/cash/retail)
        """
        self.status = InstanceStatus.CLAIMED
        self.claimed_at = datetime.now(timezone.utc)
        self.claimed_by_id = user_id
        self.claim_transaction_id = transaction_id
        
        # Update metadata
        self.claim_meta = self.claim_meta or {}
        self.claim_meta.update({
            'claim_details': {
                'value_type': value_type,
                'claimed_at': self.claimed_at.isoformat(),
                'transaction_id': transaction_id
            }
        })
        
        logger.info(f"Prize {self.instance_id} claimed by user {user_id}")

    def to_dict(self) -> Dict[str, Any]:
        """Convert instance to dictionary representation"""
        base_dict = {
            'instance_id': self.instance_id,
            'status': self.status.value if self.status else None,
            'values': {
                'retail': float(self.retail_value),
                'cash': float(self.cash_value),
                'credit': float(self.credit_value)
            },
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'discovery_info': {
                'ticket_id': self.discovering_ticket_id,
                'time': self.discovery_time.isoformat() if self.discovery_time else None
            } if self.discovering_ticket_id else None
        }

        # Add claim information if claimed
        if self.claimed_by_id:
            base_dict['claim_info'] = {
                'claimed_by': self.claimed_by_id,
                'claimed_at': self.claimed_at.isoformat() if self.claimed_at else None,
                'transaction_id': self.claim_transaction_id,
                'details': self.claim_meta.get('claim_details') if self.claim_meta else None
            }

        return base_dict

class InstantWinInstance(PrizeInstance):
    """
    Instant win prize instance
    
    Implements additional functionality specific to instant-win prizes,
    including odds calculation and validation.
    """
    individual_odds = db.Column(db.Float)
    collective_odds = db.Column(db.Float)
    
    __mapper_args__ = {
        'polymorphic_identity': 'instant_win'
    }

class DrawWinInstance(PrizeInstance):
    """
    Draw win prize instance
    
    Implements additional functionality specific to draw-win prizes,
    including distribution type management.
    """
    distribution_type = db.Column(db.Enum(DrawWinDistributionType))

    __mapper_args__ = {
        'polymorphic_identity': 'draw_win'
    }