# src/user_service/schemas/admin_schema.py

from marshmallow import Schema, fields, validate, ValidationError, EXCLUDE, pre_load
from datetime import datetime

# Preserve existing schemas
class AdminLoginSchema(Schema):
    """Schema for admin login"""
    class Meta:
        unknown = EXCLUDE

    username = fields.Str(required=True)
    password = fields.Str(required=True, load_only=True)

class AdminUserManagementSchema(Schema):
    """Schema for admin user management"""
    class Meta:
        unknown = EXCLUDE

    is_active = fields.Boolean()
    is_admin = fields.Boolean()
    reason = fields.Str(required=True, validate=validate.Length(min=5, max=255))

# New schemas for enhanced user details
class StatusChangeSchema(Schema):
    """Schema for status changes"""
    class Meta:
        unknown = EXCLUDE
    
    timestamp = fields.DateTime(required=True)
    from_status = fields.Boolean(required=True, data_key="from")
    to_status = fields.Boolean(required=True, data_key="to")
    reason = fields.Str(required=True)

class ActivitySchema(Schema):
    """Schema for user activities"""
    class Meta:
        unknown = EXCLUDE
    
    timestamp = fields.String(required=True)  # Changed from DateTime
    type = fields.Str(required=True)
    status = fields.Str(required=True)

class GamingMetricsSchema(Schema):
    """Schema for gaming metrics validation"""
    total_tickets = fields.Int(required=True)
    revealed_tickets = fields.Int(required=True)
    total_raffles = fields.Int(required=True)
    total_wins = fields.Int(required=True)

    participation = fields.Dict(keys=fields.Str(), values=fields.Number())
    performance = fields.Dict(keys=fields.Str(), values=fields.Number())

class TemporalMetricsSchema(Schema):
    """Schema for time-based analytics"""
    peak_activity_hours = fields.List(fields.Dict())
    avg_reveal_delay = fields.Float()
    purchase_frequency = fields.Float()

class EngagementMetricsSchema(Schema):
    """Schema for engagement patterns"""
    session_metrics = fields.Dict()
    retention = fields.Dict()

class FinancialMetricsSchema(Schema):
    """Schema for financial intelligence"""
    spending_patterns = fields.Dict()
    roi_metrics = fields.Dict()

class RaffleAnalyticsSchema(Schema):
    """Schema for raffle-specific insights"""
    entry_patterns = fields.Dict()
    win_analytics = fields.Dict()

class AdminResponseSchema(Schema):
    """Enhanced schema for admin responses"""
    class Meta:
        unknown = EXCLUDE

    # Core User Fields
    id = fields.Int(required=True)
    username = fields.Str(required=True)
    email = fields.Email(required=True)
    first_name = fields.Str(allow_none=True)
    last_name = fields.Str(allow_none=True)
    phone_number = fields.Str(allow_none=True)
    auth_provider = fields.Str(required=True)
    is_verified = fields.Boolean(required=True)
    is_active = fields.Boolean(required=True)
    is_admin = fields.Boolean(required=True)
    created_at = fields.String(required=True)  # Changed from DateTime
    last_login = fields.String(allow_none=True)  # Changed from DateTime
    verification_status = fields.Str()

    # Loyalty Fields
    loyalty_level = fields.Str(allow_none=True)
    loyalty_badges = fields.List(fields.Str(), allow_none=True)
    loyalty_total_entries = fields.Int(allow_none=True)
    loyalty_total_spend = fields.Float(allow_none=True)
    loyalty_streak_days = fields.Int(allow_none=True)
    loyalty_last_activity = fields.String(allow_none=True)  # Changed from DateTime
    loyalty_level_updated_at = fields.String(allow_none=True)  # Changed from DateTime

    # Gaming metrics field
    gaming_metrics = fields.Nested(GamingMetricsSchema)

    temporal_metrics = fields.Nested(TemporalMetricsSchema)
    engagement_metrics = fields.Nested(EngagementMetricsSchema)
    financial_metrics = fields.Nested(FinancialMetricsSchema)
    raffle_analytics = fields.Nested(RaffleAnalyticsSchema)

    # Balance Fields
    balance_available = fields.Float(allow_none=True)
    balance_last_updated = fields.String(allow_none=True)  # Changed from DateTime

    # History Fields
    status_changes = fields.List(fields.Nested(ActivitySchema), allow_none=True)
    recent_activities = fields.List(fields.Nested(ActivitySchema), allow_none=True)

    @pre_load
    def ensure_none_to_empty(self, data, **kwargs):
        """Convert None values to appropriate empty values"""
        if data is None:
            return {}
        
        # Ensure lists are empty rather than None
        data['loyalty_badges'] = data.get('loyalty_badges') or []
        data['status_changes'] = data.get('status_changes') or []
        data['recent_activities'] = data.get('recent_activities') or []
        
        return data
    
# For backwards compatibility
__all__ = [
    'AdminLoginSchema',
    'AdminUserManagementSchema',
    'AdminResponseSchema',
    'StatusChangeSchema',
    'ActivitySchema'
]