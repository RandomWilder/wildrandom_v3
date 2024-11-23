from datetime import datetime, timezone
from src.shared import db

class CreditTransaction(db.Model):
    """Track all credit-related transactions"""
    __tablename__ = 'credit_transactions'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    amount = db.Column(db.Float, nullable=False)
    transaction_type = db.Column(db.String(20), nullable=False)
    balance_after = db.Column(db.Float, nullable=False)
    reference_type = db.Column(db.String(50))
    reference_id = db.Column(db.String(100))
    notes = db.Column(db.String(255))
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    created_by_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)