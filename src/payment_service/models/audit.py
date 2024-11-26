from datetime import datetime, timezone
from src.shared import db
from typing import Dict
import logging

logger = logging.getLogger(__name__)

class TransactionLog(db.Model):
    """Audit trail for transactions"""
    __tablename__ = 'transaction_logs'
    
    id = db.Column(db.Integer, primary_key=True)
    transaction_id = db.Column(db.Integer, db.ForeignKey('transactions.id'), nullable=False)
    action = db.Column(db.String(50), nullable=False)
    status = db.Column(db.String(50), nullable=False)
    detail = db.Column(db.JSON, nullable=True)
    timestamp = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    def to_dict(self):
        """Convert log to dictionary"""
        return {
            'id': self.id,
            'transaction_id': self.transaction_id,
            'action': self.action,
            'status': self.status,
            'detail': self.detail,
            'timestamp': self.timestamp.isoformat()
        }