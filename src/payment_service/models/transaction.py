# src/payment_service/models/transaction.py

from datetime import datetime, timezone
from decimal import Decimal
from enum import Enum
from typing import Optional
from src.shared import db
from src.user_service.models import CreditTransaction


class TransactionType(str, Enum):
    """Transaction types"""
    DEBIT = 'debit'
    CREDIT = 'credit'

class TransactionStatus(str, Enum):
    """Transaction status states"""
    PENDING = 'pending'
    COMPLETED = 'completed'
    FAILED = 'failed'
    ROLLED_BACK = 'rolled_back'

class ReferenceType(str, Enum):
    """Transaction reference types"""
    TICKET_PURCHASE = 'ticket_purchase'
    PRIZE_CLAIM = 'prize_claim'
    REFUND = 'refund'
    ADJUSTMENT = 'adjustment'

class Transaction(db.Model):
    """Core transaction model"""
    __tablename__ = 'transactions'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    type = db.Column(db.String(20), nullable=False)
    amount = db.Column(db.Numeric(10, 2), nullable=False)
    balance_after = db.Column(db.Numeric(10, 2), nullable=True)
    status = db.Column(db.String(20), nullable=False, default=TransactionStatus.PENDING.value)
    reference_type = db.Column(db.String(50), nullable=False)
    reference_id = db.Column(db.String(100), nullable=False)
    meta_data = db.Column(db.JSON, nullable=True)  # Changed from 'metadata' to 'meta_data'
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    completed_at = db.Column(db.DateTime, nullable=True)
    credit_transaction_id = db.Column(db.Integer, db.ForeignKey('credit_transactions.id'), nullable=True)

    # Relationships
    user = db.relationship('User', backref=db.backref('transactions', lazy='dynamic'))
    audit_logs = db.relationship('TransactionLog', backref='transaction', lazy='dynamic')
    credit_transaction = db.relationship('CreditTransaction', backref=db.backref('payment_transaction', uselist=False))

    def __init__(self, **kwargs):
        super(Transaction, self).__init__(**kwargs)
        self.validate()

    def validate(self):
        """Validate transaction data"""
        if self.amount <= 0:
            raise ValueError("Transaction amount must be positive")

    def create_credit_transaction(self) -> CreditTransaction:
        """Create corresponding credit transaction"""
        credit_transaction = CreditTransaction(
            user_id=self.user_id,
            amount=-float(self.amount) if self.type == TransactionType.DEBIT.value else float(self.amount),
            transaction_type=self.reference_type,
            balance_after=float(self.balance_after) if self.balance_after else None,
            reference_type=self.reference_type,
            reference_id=self.reference_id,
            notes=self.meta_data.get('notes') if self.meta_data else None,
            created_at=datetime.now(timezone.utc),
            created_by_id=self.user_id
        )
        db.session.add(credit_transaction)
        db.session.flush()  # Get ID
        self.credit_transaction_id = credit_transaction.id
        return credit_transaction

    def complete(self, balance_after: Decimal):
        """Complete transaction"""
        self.status = TransactionStatus.COMPLETED.value
        self.balance_after = balance_after
        self.completed_at = datetime.now(timezone.utc)
        
        # Create corresponding credit transaction if not exists
        if not self.credit_transaction_id:
            self.create_credit_transaction()

    def fail(self, reason: str = None):
        """Mark transaction as failed"""
        self.status = TransactionStatus.FAILED.value
        if reason:
            self.meta_data = self.meta_data or {}
            self.meta_data['failure_reason'] = reason

    def rollback(self, reason: str = None):
        """Mark transaction as rolled back"""
        self.status = TransactionStatus.ROLLED_BACK.value
        if reason:
            self.meta_data = self.meta_data or {}
            self.meta_data['rollback_reason'] = reason

    def to_dict(self):
        """Convert transaction to dictionary"""
        return {
            'id': self.id,
            'user_id': self.user_id,
            'type': self.type,
            'amount': float(self.amount),
            'balance_after': float(self.balance_after) if self.balance_after else None,
            'status': self.status,
            'reference_type': self.reference_type,
            'reference_id': self.reference_id,
            'meta_data': self.meta_data,
            'created_at': self.created_at.isoformat(),
            'completed_at': self.completed_at.isoformat() if self.completed_at else None,
            'credit_transaction_id': self.credit_transaction_id
        }