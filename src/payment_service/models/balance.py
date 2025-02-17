# src/payment_service/models/balance.py

from datetime import datetime, timezone
from decimal import Decimal
from src.shared import db
import logging

logger = logging.getLogger(__name__)

class Balance(db.Model):
    """User balance model with optimistic locking"""
    __tablename__ = 'balances'
    
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), primary_key=True)
    available_amount = db.Column(db.Numeric(10, 2), nullable=False, default=0)
    pending_amount = db.Column(db.Numeric(10, 2), nullable=False, default=0)
    last_updated = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    version = db.Column(db.Integer, nullable=False, default=1)
    
    # Relationships
    user = db.relationship('User', backref=db.backref('balance', uselist=False))

    def can_debit(self, amount: Decimal) -> bool:
        """Check if balance can support debit"""
        return self.available_amount >= amount

    def debit(self, amount: Decimal):
        """Debit amount from balance"""
        amount = Decimal(str(amount))  # Ensure proper decimal conversion
        if not self.can_debit(amount):
            raise ValueError("Insufficient balance")
        self.available_amount -= amount
        self.last_updated = datetime.now(timezone.utc)
        self.version += 1

    def credit(self, amount: Decimal):
        """Credit amount to balance"""
        self.available_amount += amount
        self.last_updated = datetime.now(timezone.utc)
        self.version += 1

    def to_dict(self):
        """Convert balance to dictionary"""
        return {
            'user_id': self.user_id,
            'available_amount': float(self.available_amount),
            'available_balance': float(self.available_amount),
            'pending_amount': float(self.pending_amount),
            'last_updated': self.last_updated.isoformat()
        }