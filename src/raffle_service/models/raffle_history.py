from datetime import datetime, timezone
from src.shared import db
from typing import Dict

class RaffleHistory(db.Model):
    """Track raffle status and state changes for audit and history"""
    __tablename__ = 'raffle_history'

    id = db.Column(db.Integer, primary_key=True)
    raffle_id = db.Column(db.Integer, db.ForeignKey('raffles.id'), nullable=False)
    previous_status = db.Column(db.String(20), nullable=False)
    new_status = db.Column(db.String(20), nullable=False)
    previous_state = db.Column(db.String(20), nullable=False)
    new_state = db.Column(db.String(20), nullable=False)
    changed_by_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    reason = db.Column(db.String(255))
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    # Relationships
    raffle = db.relationship('Raffle', backref=db.backref('history', lazy='dynamic'))
    changed_by = db.relationship('User', backref=db.backref('raffle_changes', lazy='dynamic'))

    def __repr__(self):
        return f'<RaffleHistory {self.id}: {self.raffle_id} ({self.previous_status}->{self.new_status})>'

    def to_dict(self) -> Dict:
        """Convert history record to dictionary"""
        return {
            'id': self.id,
            'raffle_id': self.raffle_id,
            'previous_status': self.previous_status,
            'new_status': self.new_status,
            'previous_state': self.previous_state,
            'new_state': self.new_state,
            'changed_by_id': self.changed_by_id,
            'reason': self.reason,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }