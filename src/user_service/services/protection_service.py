# src/user_service/services/protection_service.py

from typing import Optional, Tuple, Dict
from datetime import datetime, timezone
from decimal import Decimal
from sqlalchemy.exc import SQLAlchemyError
from src.shared import db
from src.user_service.models.user_protection_settings import UserProtectionSettings
import logging

logger = logging.getLogger(__name__)

class ProtectionService:
    @staticmethod
    def get_user_settings(user_id: int) -> Tuple[Optional[UserProtectionSettings], Optional[str]]:
        """Get or create user protection settings"""
        try:
            settings = UserProtectionSettings.query.get(user_id)
            if not settings:
                # Create with defaults if not exists
                settings = UserProtectionSettings(user_id=user_id)
                db.session.add(settings)
                db.session.commit()
            return settings, None
        except SQLAlchemyError as e:
            logger.error(f"Database error in get_user_settings: {str(e)}")
            return None, str(e)

    @staticmethod
    def update_settings(
        user_id: int,
        settings_data: Dict
    ) -> Tuple[Optional[UserProtectionSettings], Optional[str]]:
        """Update user protection settings"""
        try:
            settings = UserProtectionSettings.query.get(user_id)
            if not settings:
                settings = UserProtectionSettings(user_id=user_id)
                db.session.add(settings)

            # Update fields
            for field in [
                'daily_max_tickets',
                'daily_spend_limit',
                'cool_down_minutes',
                'require_2fa_above'
            ]:
                if field in settings_data:
                    # Convert decimal strings to Decimal objects
                    if field in ['daily_spend_limit', 'require_2fa_above']:
                        value = Decimal(str(settings_data[field])) if settings_data[field] else None
                    else:
                        value = settings_data[field]
                    setattr(settings, field, value)

            settings.updated_at = datetime.now(timezone.utc)
            db.session.commit()

            return settings, None

        except SQLAlchemyError as e:
            db.session.rollback()
            logger.error(f"Database error in update_settings: {str(e)}")
            return None, str(e)
        except ValueError as e:
            logger.error(f"Validation error in update_settings: {str(e)}")
            return None, str(e)