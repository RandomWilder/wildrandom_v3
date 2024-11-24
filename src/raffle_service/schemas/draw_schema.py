from marshmallow import Schema, fields, validate, EXCLUDE
from src.raffle_service.models import DrawResult

class DrawResponseSchema(Schema):
    """Schema for draw responses"""
    class Meta:
        unknown = EXCLUDE

    id = fields.Int(required=True)
    raffle_id = fields.Int(required=True)
    ticket_id = fields.Int(required=True)
    draw_sequence = fields.Int(required=True)
    prize_instance_id = fields.Int(required=True)
    result = fields.Str(required=True, validate=validate.OneOf([r.value for r in DrawResult]))
    drawn_at = fields.DateTime(required=True)
    processed_at = fields.DateTime()
    
    # Nested data
    ticket_details = fields.Dict(keys=fields.Str(), values=fields.Raw())
    prize_details = fields.Dict(keys=fields.Str(), values=fields.Raw())