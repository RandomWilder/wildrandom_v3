from marshmallow import Schema, fields, validate, validates_schema, ValidationError
from src.prize_center_service.models import PrizeType, PrizeTier, DrawWinDistributionType

class PrizeTemplateCreateSchema(Schema):
    """Schema for creating prize templates"""
    name = fields.Str(required=True, validate=validate.Length(min=3, max=100))
    type = fields.Str(required=True, validate=validate.OneOf([t.value for t in PrizeType]))
    tier = fields.Str(required=True, validate=validate.OneOf([t.value for t in PrizeTier]))
    retail_value = fields.Decimal(required=True, validate=validate.Range(min=0))
    cash_value = fields.Decimal(required=True, validate=validate.Range(min=0))
    credit_value = fields.Decimal(required=True, validate=validate.Range(min=0))

class PrizeTemplateUpdateSchema(Schema):
    """Schema for updating prize templates"""
    name = fields.Str(validate=validate.Length(min=3, max=100))
    tier = fields.Str(validate=validate.OneOf([t.value for t in PrizeTier]))
    retail_value = fields.Decimal(validate=validate.Range(min=0))
    cash_value = fields.Decimal(validate=validate.Range(min=0))
    credit_value = fields.Decimal(validate=validate.Range(min=0))

class PrizePoolCreateSchema(Schema):
    """Schema for creating prize pools"""
    name = fields.Str(required=True, validate=validate.Length(min=3, max=100))
    description = fields.Str(validate=validate.Length(max=500))

class PrizePoolAllocationSchema(Schema):
    """Schema for allocating prizes to pool"""
    template_id = fields.Int(required=True)
    quantity = fields.Int(required=True, validate=validate.Range(min=1))
    collective_odds = fields.Float(validate=validate.Range(min=0, max=100))
    distribution_type = fields.Str(validate=validate.OneOf([t.value for t in DrawWinDistributionType]))

    @validates_schema
    def validate_allocation(self, data, **kwargs):
        if 'collective_odds' in data and 'distribution_type' in data:
            raise ValidationError('Cannot specify both collective_odds and distribution_type')