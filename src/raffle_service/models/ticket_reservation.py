from datetime import datetime, timezone, timedelta
from src.shared import db
from typing import List, Optional
from decimal import Decimal

class ReservationStatus:
    PENDING = 'pending'
    COMPLETED = 'completed'
    EXPIRED = 'expired'
    CANCELLED = 'cancelled'

class TicketReservation(db.Model):
    """Track ticket reservations"""
    __tablename__ = 'ticket_reservations'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    raffle_id = db.Column(db.Integer, db.ForeignKey('raffles.id'), nullable=False)
    ticket_ids = db.Column(db.JSON, nullable=False)
    total_amount = db.Column(db.Numeric(10, 2), nullable=False)
    expires_at = db.Column(db.DateTime, nullable=False)
    status = db.Column(db.String(20), default=ReservationStatus.PENDING)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    completed_at = db.Column(db.DateTime, nullable=True)
    transaction_id = db.Column(db.Integer, nullable=True)

    # Relationships
    user = db.relationship('User', backref=db.backref('ticket_reservations', lazy='dynamic'))
    raffle = db.relationship('Raffle', backref=db.backref('ticket_reservations', lazy='dynamic'))

    @property
    def is_expired(self) -> bool:
        """Check if reservation is expired with proper timezone handling"""
        now = datetime.now(timezone.utc)
        expires_at = self.expires_at.replace(tzinfo=timezone.utc) if self.expires_at.tzinfo is None else self.expires_at
        return now > expires_at

    def complete(self, transaction_id: int) -> None:
        """Mark reservation as completed"""
        self.status = ReservationStatus.COMPLETED
        self.completed_at = datetime.now(timezone.utc)
        self.transaction_id = transaction_id

    def expire(self) -> None:
        """Mark reservation as expired"""
        self.status = ReservationStatus.EXPIRED

    def cancel(self) -> None:
        """Cancel reservation"""
        self.status = ReservationStatus.CANCELLED

    def to_dict(self) -> dict:
        """Convert reservation to dictionary"""
        return {
            'id': self.id,
            'user_id': self.user_id,
            'raffle_id': self.raffle_id,
            'ticket_count': len(self.ticket_ids),
            'total_amount': float(self.total_amount),
            'status': self.status,
            'expires_at': self.expires_at.isoformat(),
            'created_at': self.created_at.isoformat(),
            'completed_at': self.completed_at.isoformat() if self.completed_at else None,
            'transaction_id': self.transaction_id
        }