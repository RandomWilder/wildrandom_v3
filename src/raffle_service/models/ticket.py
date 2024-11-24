from datetime import datetime, timezone
from src.shared import db
from enum import Enum
from sqlalchemy import Index, event, func
import logging

logger = logging.getLogger(__name__)

class TicketStatus(str, Enum):
    """Ticket states"""
    AVAILABLE = 'available'
    RESERVED = 'reserved'
    SOLD = 'sold'
    REVEALED = 'revealed'
    EXPIRED = 'expired'
    VOID = 'void'

class Ticket(db.Model):
    """Ticket model with ownership and reveal mechanics"""
    __tablename__ = 'tickets'
    __table_args__ = (
        Index('idx_ticket_id', 'ticket_id', unique=True),
        Index('idx_ticket_raffle_number', 'raffle_id', 'ticket_number', unique=True),
        Index('idx_ticket_reveal', 'raffle_id', 'user_id', 'reveal_time'),
        {'extend_existing': True}
    )

    id = db.Column(db.Integer, primary_key=True)
    raffle_id = db.Column(db.Integer, db.ForeignKey('raffles.id'), nullable=False)
    ticket_id = db.Column(db.String(20), nullable=False, unique=True)
    ticket_number = db.Column(db.String(10), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    status = db.Column(db.String(20), nullable=False, default=TicketStatus.AVAILABLE.value)
    
    # Instant win configuration
    instant_win_eligible = db.Column(db.Boolean, default=False)
    
    # Reveal mechanics
    is_revealed = db.Column(db.Boolean, default=False)
    reveal_time = db.Column(db.DateTime, nullable=True)
    reveal_sequence = db.Column(db.Integer, nullable=True)
    
    # Purchase tracking
    purchase_time = db.Column(db.DateTime, nullable=True)
    transaction_id = db.Column(db.Integer, db.ForeignKey('credit_transactions.id'), nullable=True)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    # Relationships
    raffle = db.relationship('Raffle', backref=db.backref('tickets', lazy='dynamic'))
    user = db.relationship('User', backref=db.backref('tickets', lazy='dynamic'))
    transaction = db.relationship('CreditTransaction', backref=db.backref('tickets', lazy=True))

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        if not self.ticket_id and self.raffle_id and self.ticket_number:
            self.ticket_id = f"{self.raffle_id}-{self.ticket_number}"

    def __repr__(self):
        return f'<Ticket {self.ticket_id}: {self.status}>'

    @property
    def formatted_ticket_id(self) -> str:
        """Generate the formatted ticket ID"""
        return f"{self.raffle_id}-{self.ticket_number}"

    def mark_instant_win_eligible(self) -> None:
        """Mark ticket as eligible for instant win"""
        if self.status != TicketStatus.AVAILABLE.value:
            raise ValueError("Only available tickets can be marked as instant win eligible")
        
        self.instant_win_eligible = True

    def reserve(self, user_id: int) -> bool:
        """Reserve ticket for purchase"""
        if self.status != TicketStatus.AVAILABLE.value:
            return False

        self.status = TicketStatus.RESERVED.value
        self.user_id = user_id
        return True

    def purchase(self, transaction_id: int) -> bool:
        """Complete ticket purchase"""
        if self.status not in [TicketStatus.AVAILABLE.value, TicketStatus.RESERVED.value]:
            return False

        self.status = TicketStatus.SOLD.value
        self.purchase_time = datetime.now(timezone.utc)
        self.transaction_id = transaction_id
        return True

    def reveal(self) -> bool:
        """
        Reveal the ticket
        Returns: True if successful, False if already revealed
        """
        if self.is_revealed:
            return False
            
        if self.status != TicketStatus.SOLD.value:
            raise ValueError("Only sold tickets can be revealed")

        self.is_revealed = True
        self.reveal_time = datetime.now(timezone.utc)
        self.status = TicketStatus.REVEALED.value
        
        return True

    def void(self, reason: str = None) -> bool:
        """Void ticket (admin function)"""
        if self.status in [TicketStatus.VOID.value, TicketStatus.REVEALED.value]:
            return False

        self.status = TicketStatus.VOID.value
        return True

    def expire(self) -> bool:
        """Mark ticket as expired"""
        if self.status != TicketStatus.RESERVED.value:
            return False

        self.status = TicketStatus.EXPIRED.value
        self.user_id = None
        return True

    def to_dict(self):
        """Convert ticket to dictionary"""
        return {
            'id': self.id,
            'ticket_id': self.ticket_id,
            'ticket_number': self.ticket_number,
            'raffle_id': self.raffle_id,
            'user_id': self.user_id,
            'status': self.status,
            'instant_win_eligible': self.instant_win_eligible,
            'is_revealed': self.is_revealed,
            'reveal_time': self.reveal_time.isoformat() if self.reveal_time else None,
            'reveal_sequence': self.reveal_sequence,
            'purchase_time': self.purchase_time.isoformat() if self.purchase_time else None,
            'transaction_id': self.transaction_id,
            'created_at': self.created_at.isoformat()
        }

# SQLAlchemy event listeners for ticket status changes
@event.listens_for(Ticket.status, 'set')
def ticket_status_change(target, value, oldvalue, initiator):
    """Handle ticket status changes"""
    if oldvalue == value:
        return
        
    if value == TicketStatus.REVEALED.value:
        target.reveal_time = datetime.now(timezone.utc)