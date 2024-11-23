# src/user_service/schemas/user_schema.py

from marshmallow import Schema, fields, validate, validates_schema, ValidationError, EXCLUDE
import re

class UserBaseSchema(Schema):
    """Base schema with common user fields"""
    class Meta:
        unknown = EXCLUDE

    username = fields.Str(
        required=True, 
        validate=[
            validate.Length(min=3, max=64),
            validate.Regexp(
                r'^[a-zA-Z0-9_-]+$',
                error='Username can only contain letters, numbers, underscores and dashes'
            )
        ]
    )
    email = fields.Email(required=True)
    first_name = fields.Str(validate=validate.Length(max=64))
    last_name = fields.Str(validate=validate.Length(max=64))
    phone_number = fields.Str(validate=validate.Length(max=20), allow_none=True)

    @validates_schema
    def validate_phone(self, data, **kwargs):
        """Validate phone number format if provided"""
        if 'phone_number' in data and data['phone_number']:
            phone = data['phone_number']
            if not re.match(r'^\+?1?\d{9,15}$', phone):
                raise ValidationError({'phone_number': ['Invalid phone number format']})

class UserRegistrationSchema(UserBaseSchema):
    """Schema for user registration"""
    password = fields.Str(
        required=True,
        validate=validate.Length(min=8, max=128),
        load_only=True
    )

    @validates_schema
    def validate_password_strength(self, data, **kwargs):
        """Validate password meets security requirements"""
        password = data['password']
        errors = []
        
        if not any(c.isupper() for c in password):
            errors.append("Password must contain at least one uppercase letter")
        if not any(c.islower() for c in password):
            errors.append("Password must contain at least one lowercase letter")
        if not any(c.isdigit() for c in password):
            errors.append("Password must contain at least one number")
        if not any(c in '!@#$%^&*()_+-=[]{}|;:,.<>?' for c in password):
            errors.append("Password must contain at least one special character")
            
        if errors:
            raise ValidationError({'password': errors})

class UserLoginSchema(Schema):
    """Schema for user login"""
    class Meta:
        unknown = EXCLUDE

    username = fields.Str(required=True)
    password = fields.Str(required=True, load_only=True)

class UserUpdateSchema(Schema):
    """Schema for user profile updates"""
    class Meta:
        unknown = EXCLUDE

    email = fields.Email(required=False)
    first_name = fields.Str(validate=validate.Length(max=64))
    last_name = fields.Str(validate=validate.Length(max=64))
    phone_number = fields.Str(validate=validate.Length(max=20), allow_none=True)
    current_password = fields.Str(load_only=True, required=False)

    @validates_schema
    def validate_email_update(self, data, **kwargs):
        """Validate email update requirements"""
        if 'email' in data and not data.get('current_password'):
            raise ValidationError(
                'current_password is required when updating email'
            )

    @validates_schema
    def validate_phone(self, data, **kwargs):
        """Validate phone number format if provided"""
        if 'phone_number' in data and data['phone_number']:
            phone = data['phone_number']
            if not re.match(r'^\+?1?\d{9,15}$', phone):
                raise ValidationError({'phone_number': ['Invalid phone number format']})

class UserResponseSchema(Schema):
    """Schema for user responses"""
    class Meta:
        unknown = EXCLUDE

    id = fields.Int(required=True)
    username = fields.Str(required=True)
    email = fields.Email(required=True)
    first_name = fields.Str()
    last_name = fields.Str()
    phone_number = fields.Str()
    site_credits = fields.Float()
    is_active = fields.Bool()
    is_verified = fields.Bool()
    created_at = fields.DateTime()
    last_login = fields.DateTime()