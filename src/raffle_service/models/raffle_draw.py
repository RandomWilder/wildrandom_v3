"""
Raffle Draw Model

Handles raffle draw records with comprehensive tracking of winners, prize assignments,
and proper formatting for business requirements. Implements both storage and presentation
layer functionality while maintaining data integrity and relationships.
"""

from datetime import datetime, timezone
from src.shared import db
from enum import Enum
import logging

logger = logging.getLogger(__name__)

class DrawResult(str, Enum):
    """Draw result types with string value support"""
    WINNER = 'winner'
    NO_WINNER = 'no_winner'

    def __str__(self) -> str:
        return self.value

class RaffleDraw(db.Model):
    """
    Track raffle draws and winners with comprehensive state management.
    
    This model maintains the relationship between raffles, tickets, and prizes,
    handling both instant-win and scheduled draw scenarios.
    
    Business Rules:
    - Each draw has a unique sequence number within its raffle
    - Ticket IDs are stored in formatted form: {raffle_id}-{ticket_number}
    - Draw results are final once processed
    """
    __tablename__ = 'raffle_draws'
    
    # Define table-level constraints and indexes
    __table_args__ = (
        # Index for efficient ticket lookups
        db.Index('idx_ticket_id', 'ticket_id'),
        
        # Ensure unique draw sequence per raffle
        db.UniqueConstraint(
            'raffle_id', 
            'draw_sequence', 
            name='uq_raffle_draw_sequence'
        ),
        
        # Allow table definition updates
        {'extend_existing': True}
    )

    # Primary fields
    id = db.Column(db.Integer, primary_key=True)
    raffle_id = db.Column(db.Integer, db.ForeignKey('raffles.id'), nullable=False)
    ticket_id = db.Column(db.String(20), nullable=False)  # Format: {raffle_id}-{ticket_number}
    draw_sequence = db.Column(db.Integer, nullable=False)
    prize_instance_id = db.Column(db.Integer, db.ForeignKey('prize_instances.id'), nullable=False)
    result = db.Column(db.String(20), nullable=False)
    drawn_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    processed_at = db.Column(db.DateTime, nullable=True)

    # Relationships with proper join conditions
    raffle = db.relationship(
        'Raffle',
        backref=db.backref('draws', lazy='dynamic')
    )
    
    ticket = db.relationship(
        'Ticket',
        primaryjoin="RaffleDraw.ticket_id == Ticket.ticket_id",
        foreign_keys=[ticket_id],
        uselist=False,  # One-to-one relationship
        viewonly=True   # Read-only since no FK constraint
    )
    
    prize_instance = db.relationship(
        'PrizeInstance',
        backref=db.backref('draws', lazy='dynamic')
    )

    def __init__(self, **kwargs):
        """Initialize draw record with automatic result calculation"""
        super().__init__(**kwargs)
        if not kwargs.get('result'):
            self.calculate_result()

    def __repr__(self) -> str:
        """String representation for debugging"""
        return (
            f'<RaffleDraw {self.id}: '
            f'Raffle {self.raffle_id} '
            f'Sequence {self.draw_sequence}>'
        )

    def get_formatted_ticket_id(self) -> str:
        """Get business format ticket identifier {raffle_id}-{ticket_number}"""
        try:
            if not self.ticket:
                return None
            return f"{self.raffle_id}-{self.ticket.ticket_number}"
        except Exception as e:
            logger.error(f"Error formatting ticket ID: {str(e)}")
            return None

    def calculate_result(self) -> None:
        """Calculate draw result based on ticket ownership"""
        if self.ticket and self.ticket.user_id:
            self.result = DrawResult.WINNER.value
        else:
            self.result = DrawResult.NO_WINNER.value

    def process_draw(self) -> bool:
        """Process draw result and update related records"""
        try:
            if self.processed_at:
                logger.warning(f"Draw {self.id} already processed")
                return False

            if self.result == DrawResult.WINNER.value:
                # Update prize instance status
                self.prize_instance.assign_to_user(self.ticket.user_id)
                logger.info(f"Prize {self.prize_instance_id} assigned to user {self.ticket.user_id}")

            self.processed_at = datetime.now(timezone.utc)
            db.session.commit()
            logger.info(f"Draw {self.id} processed successfully")
            return True

        except Exception as e:
            logger.error(f"Error processing draw {self.id}: {str(e)}")
            db.session.rollback()
            return False

    def to_dict(self) -> dict:
        """
        Convert draw record to dictionary with complete details
        
        Returns dictionary containing:
        - Draw record details
        - Formatted ticket identifier
        - Comprehensive ticket information
        - Prize details including values
        """
        try:
            return {
                'id': self.id,
                'raffle_id': self.raffle_id,
                'ticket_id': self.ticket_id,
                'draw_sequence': self.draw_sequence,
                'prize_instance_id': self.prize_instance_id,
                'result': self.result,
                'drawn_at': self.drawn_at.isoformat() if self.drawn_at else None,
                'processed_at': self.processed_at.isoformat() if self.processed_at else None,
                'ticket_details': {
                    'number': self.ticket.ticket_number,
                    'user_id': self.ticket.user_id,
                    'reveal_time': self.ticket.reveal_time.isoformat() if self.ticket and self.ticket.reveal_time else None
                } if self.ticket else None,
                'prize_details': {
                    'instance_id': self.prize_instance.instance_id,
                    'type': self.prize_instance.instance_type,
                    'status': self.prize_instance.status,
                    'values': {
                        'retail': float(self.prize_instance.retail_value),
                        'cash': float(self.prize_instance.cash_value),
                        'credit': float(self.prize_instance.credit_value)
                    }
                } if self.prize_instance else None
            }
        except Exception as e:
            logger.error(f"Error converting draw {self.id} to dict: {str(e)}")
            return {'error': 'Failed to format draw data'}

    @classmethod
    def get_raffle_winners(cls, raffle_id: int) -> list:
        """Get all winning draws for a raffle ordered by sequence"""
        return cls.query.filter_by(
            raffle_id=raffle_id,
            result=DrawResult.WINNER.value
        ).order_by(cls.draw_sequence).all()

    @classmethod
    def get_user_wins(cls, user_id: int) -> list:
        """Get all winning draws for a user ordered by draw time"""
        return cls.query.join(cls.ticket).filter(
            cls.result == DrawResult.WINNER.value,
            cls.ticket.has(user_id=user_id)
        ).order_by(cls.drawn_at.desc()).all()