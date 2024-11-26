# src/payment_service/schemas/transaction_schema.py

from marshmallow import Schema, fields, validate, validates_schema, ValidationError, EXCLUDE
from decimal import Decimal
from typing import List

class TicketPurchaseSchema(Schema):
    """Schema for ticket purchase validation"""
    class Meta:
        unknown = EXCLUDE

    raffle_id = fields.Int(required=True)
    ticket_ids = fields.List(fields.Str(), required=True, validate=validate.Length(min=1))
    total_amount = fields.Decimal(required=True, validate=validate.Range(min=Decimal('0.01')))

    @validates_schema
    def validate_amounts(self, data, **kwargs):
        if 'total_amount' in data:
            # Ensure amount has no more than 2 decimal places
            if abs(data['total_amount'].as_tuple().exponent) > 2:
                raise ValidationError('Amount cannot have more than 2 decimal places')

class BalanceAdjustmentSchema(Schema):
    """Schema for admin balance adjustments"""
    class Meta:
        unknown = EXCLUDE

    user_id = fields.Int(required=True)
    amount = fields.Decimal(required=True, validate=validate.Range(min=Decimal('0.01')))
    is_credit = fields.Boolean(required=True)
    reason = fields.Str(required=True, validate=validate.Length(min=5, max=255))

class RefundProcessSchema(Schema):
    """Schema for refund processing"""
    class Meta:
        unknown = EXCLUDE

    transaction_id = fields.Int(required=True)
    reason = fields.Str(required=True, validate=validate.Length(min=5, max=255))

class TransactionFilterSchema(Schema):
    """Schema for transaction list filtering"""
    class Meta:
        unknown = EXCLUDE

    page = fields.Int(validate=validate.Range(min=1), missing=1)
    per_page = fields.Int(validate=validate.Range(min=1, max=100), missing=20)
    user_id = fields.Int()
    status = fields.Str(validate=validate.OneOf(['pending', 'completed', 'failed', 'rolled_back']))
    reference_type = fields.Str(validate=validate.OneOf(['ticket_purchase', 'prize_claim', 'refund', 'adjustment']))
