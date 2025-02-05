# src/user_service/schemas/protection_schema.py

from marshmallow import Schema, fields, validate, validates_schema, ValidationError
from decimal import Decimal

class ProtectionSettingsSchema(Schema):
    """Schema for user protection settings validation"""
    daily_max_tickets = fields.Int(
        validate=validate.Range(min=1, max=1000),
        required=True
    )
    
    daily_spend_limit = fields.Decimal(
        validate=validate.Range(min=Decimal('0.01'), max=Decimal('10000.00')),
        required=True
    )
    cool_down_minutes = fields.Int(
        validate=validate.Range(min=0, max=1440),  # Max 24 hours
        required=True
    )
    require_2fa_above = fields.Decimal(
        validate=validate.Range(min=Decimal('0.01'), max=Decimal('10000.00')),
        allow_none=True
    )


class ProtectionSettingsResponseSchema(ProtectionSettingsSchema):
    """Schema for protection settings responses"""
    last_purchase_time = fields.DateTime(allow_none=True)
    updated_at = fields.DateTime(required=True)