# src/user_service/schemas/__init__.py

# User-related schemas
from .user_schema import (
    UserBaseSchema,
    UserRegistrationSchema,
    UserLoginSchema,
    UserUpdateSchema,
    UserResponseSchema
)

# Password management schemas
from .password_schema import (
    PasswordResetRequestSchema,
    PasswordResetSchema,
    PasswordChangeSchema
)

# Admin schemas
from .admin_schema import (
    AdminLoginSchema,
    AdminUserManagementSchema,
    AdminResponseSchema,
    StatusChangeSchema,
    ActivitySchema
)

# Protection settings schemas
from .protection_schema import (
    ProtectionSettingsSchema,
    ProtectionSettingsResponseSchema
)

__all__ = [
    # User schemas
    'UserBaseSchema',
    'UserRegistrationSchema',
    'UserLoginSchema',
    'UserUpdateSchema',
    'UserResponseSchema',
    
    # Password schemas
    'PasswordResetRequestSchema',
    'PasswordResetSchema',
    'PasswordChangeSchema',
    
    # Admin schemas
    'AdminLoginSchema',
    'AdminUserManagementSchema',
    'AdminResponseSchema',
    'StatusChangeSchema',
    'ActivitySchema',
    
    # Protection schemas
    'ProtectionSettingsSchema',
    'ProtectionSettingsResponseSchema'
]