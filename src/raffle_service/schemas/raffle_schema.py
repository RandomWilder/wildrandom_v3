from marshmallow import Schema, fields, validate, validates_schema, ValidationError, EXCLUDE
from datetime import datetime, timezone
from src.raffle_service.models import RaffleStatus, RaffleState

class RaffleCreateSchema(Schema):
    """Schema for creating new raffle"""
    class Meta:
        unknown = EXCLUDE

    title = fields.Str(required=True, validate=validate.Length(min=3, max=100))
    description = fields.Str(validate=validate.Length(max=1000))
    prize_pool_id = fields.Int(required=True)
    total_tickets = fields.Int(required=True, validate=validate.Range(min=1))
    ticket_price = fields.Float(required=True, validate=validate.Range(min=0.01))
    max_tickets_per_user = fields.Int(required=True, validate=validate.Range(min=1))
    start_time = fields.DateTime(required=True)
    end_time = fields.DateTime(required=True)

    @validates_schema
    def validate_dates(self, data, **kwargs):
        """Validate date relationships"""
        if data['start_time'] >= data['end_time']:
            raise ValidationError('End time must be after start time')
            
        if data['start_time'] <= datetime.now(timezone.utc):
            raise ValidationError('Start time must be in the future')

class RaffleUpdateSchema(Schema):
    """Schema for updating raffle details"""
    class Meta:
        unknown = EXCLUDE

    title = fields.Str(validate=validate.Length(min=3, max=100))
    description = fields.Str(validate=validate.Length(max=1000))
    ticket_price = fields.Float(validate=validate.Range(min=0.01))
    max_tickets_per_user = fields.Int(validate=validate.Range(min=1))
    start_time = fields.DateTime()
    end_time = fields.DateTime()

    @validates_schema
    def validate_dates(self, data, **kwargs):
        """Validate date relationships if both are provided"""
        if 'start_time' in data and 'end_time' in data:
            if data['start_time'] >= data['end_time']:
                raise ValidationError('End time must be after start time')
            
            if data['start_time'] <= datetime.now(timezone.utc):
                raise ValidationError('Start time must be in the future')

class StatusUpdateSchema(Schema):
    """Schema for status updates"""
    class Meta:
        unknown = EXCLUDE

    status = fields.Str(
        required=True,
        validate=validate.OneOf([s.value for s in RaffleStatus])
    )
    reason = fields.Str(validate=validate.Length(max=255))

class StateUpdateSchema(Schema):
    """Schema for state updates"""
    class Meta:
        unknown = EXCLUDE

    state = fields.Str(
        required=True,
        validate=validate.OneOf([s.value for s in RaffleState])
    )
    reason = fields.Str(validate=validate.Length(max=255))

class DrawExecutionSchema(Schema):
    """Schema for executing draws"""
    class Meta:
        unknown = EXCLUDE

    draw_count = fields.Int(validate=validate.Range(min=1), missing=1)

class TimeRemainingSchema(Schema):
    """Schema for time remaining data"""
    seconds_to_start = fields.Int(required=True)
    seconds_to_end = fields.Int(required=True)
    formatted_time_to_start = fields.Str(required=True)
    formatted_time_to_end = fields.Str(required=True)

class PrizePoolSummarySchema(Schema):
    """Schema for prize pool summary"""
    total_instances = fields.Int(required=True)
    available_instances = fields.Dict(
        keys=fields.Str(),
        values=fields.Int(),
        required=True
    )
    total_value = fields.Dict(
        keys=fields.Str(),
        values=fields.Float(),
        required=True
    )

class RaffleResponseSchema(Schema):
    """Schema for raffle responses"""
    class Meta:
        unknown = EXCLUDE

    id = fields.Int(required=True)
    title = fields.Str(required=True)
    description = fields.Str()
    prize_pool_id = fields.Int(required=True)
    total_tickets = fields.Int(required=True)
    ticket_price = fields.Float(required=True)
    max_tickets_per_user = fields.Int(required=True)
    start_time = fields.DateTime(required=True)
    end_time = fields.DateTime(required=True)
    status = fields.Str(required=True)
    state = fields.Str(required=True)
    created_at = fields.DateTime(required=True)
    updated_at = fields.DateTime()
    is_visible = fields.Bool(required=True)
    time_remaining = fields.Nested(TimeRemainingSchema, required=True)
    prize_pool_summary = fields.Nested(PrizePoolSummarySchema)  # Optional as it depends on loading