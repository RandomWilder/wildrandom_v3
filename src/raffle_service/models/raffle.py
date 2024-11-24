from datetime import datetime, timezone
from src.shared import db
from enum import Enum
from typing import Optional, Tuple
import logging

logger = logging.getLogger(__name__)

class RaffleStatus(str, Enum):
    """Raffle administrative statuses"""
    INACTIVE = 'inactive'
    ACTIVE = 'active'
    CANCELLED = 'cancelled'

class RaffleState(str, Enum):
    """Raffle operational states"""
    DRAFT = 'draft'
    COMING_SOON = 'coming_soon'
    OPEN = 'open'
    PAUSED = 'paused'
    ENDED = 'ended'

class Raffle(db.Model):
    """Core raffle model with enhanced status/state management"""
    __tablename__ = 'raffles'
    __table_args__ = (
        db.CheckConstraint('start_time < end_time', name='valid_dates'),
        {'extend_existing': True}
    )

    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text)
    prize_pool_id = db.Column(db.Integer, db.ForeignKey('prize_pools.id'), nullable=False)
    total_tickets = db.Column(db.Integer, nullable=False)
    ticket_price = db.Column(db.Numeric(10, 2), nullable=False)
    max_tickets_per_user = db.Column(db.Integer, nullable=False)
    start_time = db.Column(db.DateTime, nullable=False)
    end_time = db.Column(db.DateTime, nullable=False)
    status = db.Column(db.String(20), nullable=False, default=RaffleStatus.INACTIVE.value)
    state = db.Column(db.String(20), nullable=False, default=RaffleState.DRAFT.value)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = db.Column(db.DateTime, onupdate=lambda: datetime.now(timezone.utc))
    created_by_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)

    # Relationships
    created_by = db.relationship('User', backref=db.backref('raffles_created', lazy=True))
    prize_pool = db.relationship('PrizePool', backref=db.backref('raffles', lazy=True))

    def __repr__(self):
        return f'<Raffle {self.id}: {self.title} ({self.status}/{self.state})>'

    def calculate_state(self) -> RaffleState:
        """Calculate current state based on time and status"""
        current_time = datetime.now(timezone.utc)
        
        if self.status == RaffleStatus.CANCELLED.value:
            return RaffleState.ENDED

        if current_time >= self.end_time:
            return RaffleState.ENDED

        if self.status == RaffleStatus.INACTIVE.value:
            if current_time < self.start_time:
                return RaffleState.DRAFT
            else:
                return RaffleState.PAUSED

        # Status is ACTIVE
        if current_time < self.start_time:
            return RaffleState.COMING_SOON
        else:
            return RaffleState.OPEN

    def update_state(self) -> None:
        """Update state based on current time and status"""
        new_state = self.calculate_state()
        if new_state.value != self.state:
            from src.raffle_service.models import RaffleHistory
            
            # Create history record
            history = RaffleHistory(
                raffle_id=self.id,
                previous_status=self.status,
                new_status=self.status,
                previous_state=self.state,
                new_state=new_state.value,
                reason="Automatic state update"
            )
            db.session.add(history)
            
            # Update state
            self.state = new_state.value
            self.updated_at = datetime.now(timezone.utc)

    def can_be_activated(self) -> Tuple[bool, Optional[str]]:
        """Check if raffle can be activated"""
        if self.status == RaffleStatus.CANCELLED.value:
            return False, "Cancelled raffles cannot be activated"

        if not self.prize_pool_id:
            return False, "Raffle must have a prize pool assigned"

        if self.end_time <= datetime.now(timezone.utc):
            return False, "Cannot activate raffle after end time"

        # Verify prize pool is locked
        if not self.prize_pool or self.prize_pool.status != 'locked':
            return False, "Prize pool must be locked"

        return True, None

    def activate(self) -> Tuple[bool, Optional[str]]:
        """Activate raffle"""
        can_activate, error = self.can_be_activated()
        if not can_activate:
            return False, error

        from src.raffle_service.models import RaffleHistory
        
        # Create history record
        history = RaffleHistory(
            raffle_id=self.id,
            previous_status=self.status,
            new_status=RaffleStatus.ACTIVE.value,
            previous_state=self.state,
            new_state=self.calculate_state().value,
            reason="Manual activation"
        )
        db.session.add(history)

        # Update status
        self.status = RaffleStatus.ACTIVE.value
        self.update_state()
        
        return True, None

    def deactivate(self) -> Tuple[bool, Optional[str]]:
        """Deactivate raffle"""
        if self.status == RaffleStatus.CANCELLED.value:
            return False, "Cannot deactivate cancelled raffle"

        from src.raffle_service.models import RaffleHistory
        
        # Create history record
        history = RaffleHistory(
            raffle_id=self.id,
            previous_status=self.status,
            new_status=RaffleStatus.INACTIVE.value,
            previous_state=self.state,
            new_state=self.calculate_state().value,
            reason="Manual deactivation"
        )
        db.session.add(history)

        # Update status
        self.status = RaffleStatus.INACTIVE.value
        self.update_state()
        
        return True, None

    def cancel(self) -> Tuple[bool, Optional[str]]:
        """Cancel raffle"""
        if self.status != RaffleStatus.INACTIVE.value:
            return False, "Raffle must be inactive to cancel"

        from src.raffle_service.models import RaffleHistory
        
        # Create history record
        history = RaffleHistory(
            raffle_id=self.id,
            previous_status=self.status,
            new_status=RaffleStatus.CANCELLED.value,
            previous_state=self.state,
            new_state=RaffleState.ENDED.value,
            reason="Manual cancellation"
        )
        db.session.add(history)

        # Update status and state
        self.status = RaffleStatus.CANCELLED.value
        self.state = RaffleState.ENDED.value
        
        return True, None

    def is_visible(self) -> bool:
        """Check if raffle should be visible in main UI"""
        return (
            self.status == RaffleStatus.ACTIVE.value or
            (self.status == RaffleStatus.INACTIVE.value and 
             self.state == RaffleState.COMING_SOON.value)
        )

    def to_dict(self):
        """Convert raffle to dictionary"""
        return {
            'id': self.id,
            'title': self.title,
            'description': self.description,
            'prize_pool_id': self.prize_pool_id,
            'total_tickets': self.total_tickets,
            'ticket_price': float(self.ticket_price),
            'max_tickets_per_user': self.max_tickets_per_user,
            'start_time': self.start_time.isoformat() if self.start_time else None,
            'end_time': self.end_time.isoformat() if self.end_time else None,
            'status': self.status,
            'state': self.state,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'is_visible': self.is_visible()
        }