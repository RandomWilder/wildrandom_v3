# src/user_service/schemas/admin_schema.py

from marshmallow import Schema, fields, validate, validates_schema, ValidationError, EXCLUDE

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

    username = fields.Str(required=True)
    email = fields.Email(required=True)
    is_active = fields.Boolean()
    is_admin = fields.Boolean()
    reason = fields.Str(required=True, validate=validate.Length(min=5, max=255))

class AdminResponseSchema(Schema):
    """Schema for admin responses"""
    class Meta:
        unknown = EXCLUDE

    id = fields.Int(required=True)
    username = fields.Str(required=True)
    email = fields.Email(required=True)
    is_admin = fields.Boolean(required=True)
    is_active = fields.Boolean(required=True)
    last_login = fields.DateTime()
    created_at = fields.DateTime()