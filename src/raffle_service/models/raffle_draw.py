from datetime import datetime, timezone
from src.shared import db
from enum import Enum
import logging

logger = logging.getLogger(__name__)

class DrawResult(str, Enum):
    """Draw result types"""
    WINNER = 'winner'
    NO_WINNER = 'no_winner'

class RaffleDraw(db.Model):
    """Track raffle draws and winners"""
    __tablename__ = 'raffle_draws'
    __table_args__ = (
        db.UniqueConstraint('raffle_id', 'draw_sequence', name='uq_raffle_draw_sequence'),
        {'extend_existing': True}
    )

    id = db.Column(db.Integer, primary_key=True)
    raffle_id = db.Column(db.Integer, db.ForeignKey('raffles.id'), nullable=False)
    ticket_id = db.Column(db.Integer, db.ForeignKey('tickets.id'), nullable=False)
    draw_sequence = db.Column(db.Integer, nullable=False)
    prize_instance_id = db.Column(db.Integer, db.ForeignKey('prize_instances.id'), nullable=False)
    result = db.Column(db.String(20), nullable=False)
    drawn_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    processed_at = db.Column(db.DateTime, nullable=True)

    # Relationships
    raffle = db.relationship('Raffle', backref=db.backref('draws', lazy='dynamic'))
    ticket = db.relationship('Ticket', backref=db.backref('draws', lazy='dynamic'))
    prize_instance = db.relationship('PrizeInstance', backref=db.backref('draws', lazy='dynamic'))

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        if not kwargs.get('result'):
            self.calculate_result()

    def __repr__(self):
        return f'<RaffleDraw {self.id}: Raffle {self.raffle_id} Sequence {self.draw_sequence}>'

    def calculate_result(self) -> None:
        """Calculate draw result based on ticket ownership"""
        if self.ticket.user_id:
            self.result = DrawResult.WINNER.value
        else:
            self.result = DrawResult.NO_WINNER.value

    def process_draw(self) -> bool:
        """Process draw result and update related records"""
        try:
            if self.processed_at:
                return False

            if self.result == DrawResult.WINNER.value:
                # Update prize instance status
                self.prize_instance.assign_to_user(self.ticket.user_id)
                
            self.processed_at = datetime.now(timezone.utc)
            db.session.commit()
            return True

        except Exception as e:
            logger.error(f"Error processing draw {self.id}: {str(e)}")
            db.session.rollback()
            return False

    def to_dict(self):
        """Convert draw record to dictionary"""
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
                'ticket_number': self.ticket.ticket_number,
                'user_id': self.ticket.user_id
            } if self.ticket else None,
            'prize_details': {
                'type': self.prize_instance.instance_type,
                'status': self.prize_instance.status
            } if self.prize_instance else None
        }

    @classmethod
    def get_raffle_winners(cls, raffle_id: int):
        """Get all winning draws for a raffle"""
        return cls.query.filter_by(
            raffle_id=raffle_id,
            result=DrawResult.WINNER.value
        ).order_by(cls.draw_sequence).all()

    @classmethod
    def get_user_wins(cls, user_id: int):
        """Get all winning draws for a user"""
        return cls.query.join(cls.ticket).filter(
            cls.result == DrawResult.WINNER.value,
            cls.ticket.has(user_id=user_id)
        ).order_by(cls.drawn_at.desc()).all()