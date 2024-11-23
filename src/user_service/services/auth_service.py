# src/user_service/services/auth_service.py

from typing import Optional, Tuple, Dict
from datetime import datetime, timezone
from sqlalchemy.exc import SQLAlchemyError
from src.shared import db
from src.user_service.models import User
from src.shared.auth import create_token
from src.user_service.services.activity_service import ActivityService
import logging

logger = logging.getLogger(__name__)

class AuthService:
    @staticmethod
    def authenticate(username: str, password: str) -> Tuple[Optional[Dict], Optional[str]]:
        """Generic authentication for any user type"""
        try:
            # Find user
            user = User.query.filter_by(username=username).first()
            logger.debug(f"Authentication attempt for username: {username}")
            logger.debug(f"User found: {user is not None}")
            
            if user:
                logger.debug(f"User details:")
                logger.debug(f"ID: {user.id}")
                logger.debug(f"Auth Provider: {user.auth_provider}")
                logger.debug(f"Has password hash: {bool(user.password_hash)}")
                if user.password_hash:
                    logger.debug(f"Password hash: {user.password_hash[:20]}...")
                
                # Test password directly
                from werkzeug.security import check_password_hash
                direct_check = check_password_hash(user.password_hash, password) if user.password_hash else False
                logger.debug(f"Direct password check result: {direct_check}")
                
                # Test through model method
                model_check = user.check_password(password)
                logger.debug(f"Model password check result: {model_check}")
            
            if not user or not user.check_password(password):
                return None, "Invalid credentials"
                
            if not user.is_active:
                return None, "Account is deactivated"

            # Update last login
            user.last_login = datetime.now(timezone.utc)
            
            # Create token with appropriate claims
            token_data = {
                'user_id': user.id,
                'is_admin': user.is_admin
            }
            token = create_token(user.id, additional_data=token_data)
            
            # Log activity
            ActivityService.log_activity(
                user_id=user.id,
                activity_type='login',
                request=None,
                status='success'
            )
            
            db.session.commit()
            
            return {
                'user': user.to_dict(),
                'token': token
            }, None
            
        except SQLAlchemyError as e:
            db.session.rollback()
            logger.error(f"Database error in authenticate: {str(e)}")
            return None, str(e)