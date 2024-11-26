# src/payment_service/schemas/response_schema.py

from marshmallow import Schema, fields, validate, EXCLUDE
from decimal import Decimal
from datetime import datetime
import pytz

class TransactionResponseSchema(Schema):
    """Schema for transaction responses"""
    class Meta:
        unknown = EXCLUDE

    id = fields.Int(required=True)
    user_id = fields.Int(required=True)
    type = fields.Str(required=True)
    amount = fields.Decimal(required=True, as_string=True)
    balance_after = fields.Decimal(as_string=True)
    status = fields.Str(required=True)
    reference_type = fields.Str(required=True)
    reference_id = fields.Str(required=True)
    metadata = fields.Dict(allow_none=True)
    created_at = fields.DateTime(required=True)
    completed_at = fields.DateTime(allow_none=True)

    def format_datetime(self, dt: datetime) -> str:
        """Format datetime to ISO format with timezone"""
        if dt and not dt.tzinfo:
            dt = pytz.UTC.localize(dt)
        return dt.isoformat() if dt else None

    def format_decimal(self, value: Decimal) -> str:
        """Format decimal values to string with fixed precision"""
        return f"{value:.2f}" if value is not None else None

class BalanceResponseSchema(Schema):
    """Schema for balance responses"""
    class Meta:
        unknown = EXCLUDE

    user_id = fields.Int(required=True)
    available_amount = fields.Decimal(required=True, as_string=True)
    pending_amount = fields.Decimal(required=True, as_string=True)
    last_updated = fields.DateTime(required=True)

    def format_datetime(self, dt: datetime) -> str:
        """Format datetime to ISO format with timezone"""
        if dt and not dt.tzinfo:
            dt = pytz.UTC.localize(dt)
        return dt.isoformat() if dt else None