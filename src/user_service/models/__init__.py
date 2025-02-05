# src/user_service/models/__init__.py

from .user import User
from .user_status import UserStatusChange
from .user_activity import UserActivity
from .credit_transaction import CreditTransaction
from .password_reset import PasswordReset
from .user_loyalty import UserLoyalty, LoyaltyHistory  # Add this line
from .user_protection_settings import UserProtectionSettings

import src.user_service.models.relationships

__all__ = [
    'User',
    'UserStatusChange',
    'UserActivity',
    'CreditTransaction',
    'PasswordReset',
    'UserLoyalty',        # Add this
    'LoyaltyHistory',
    'UserProtectionSettings'      # Add this
]