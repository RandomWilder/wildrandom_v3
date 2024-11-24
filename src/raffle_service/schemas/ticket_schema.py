from marshmallow import Schema, fields, validate, EXCLUDE
from src.raffle_service.models import TicketStatus

class TicketRevealSchema(Schema):
    """Schema for revealing tickets"""
    class Meta:
        unknown = EXCLUDE

    ticket_ids = fields.List(fields.Str(), required=True, validate=validate.Length(min=1))

class TicketFilterSchema(Schema):
    """Schema for ticket filtering"""
    class Meta:
        unknown = EXCLUDE

    status = fields.Str(validate=validate.OneOf([s.value for s in TicketStatus]))
    user_id = fields.Int()
    revealed = fields.Bool()
    
class TicketResponseSchema(Schema):
    """Schema for ticket responses"""
    class Meta:
        unknown = EXCLUDE

    id = fields.Int(required=True)
    ticket_id = fields.Str(required=True)
    ticket_number = fields.Str(required=True)
    raffle_id = fields.Int(required=True)
    user_id = fields.Int()
    status = fields.Str(required=True)
    instant_win_eligible = fields.Bool(required=True)
    is_revealed = fields.Bool(required=True)
    reveal_time = fields.DateTime()
    reveal_sequence = fields.Int()
    purchase_time = fields.DateTime()
    transaction_id = fields.Int()
    created_at = fields.DateTime(required=True)

class TicketStatsSchema(Schema):
    """Schema for ticket statistics"""
    class Meta:
        unknown = EXCLUDE

    total_tickets = fields.Int(required=True)
    available_tickets = fields.Int(required=True)
    sold_tickets = fields.Int(required=True)
    revealed_tickets = fields.Int(required=True)
    eligible_tickets = fields.Int(required=True)
    unique_participants = fields.Int(required=True)