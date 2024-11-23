# src/user_service/services/password_service.py

from typing import Optional, Tuple, Dict
from datetime import datetime, timezone, timedelta
import secrets
from sqlalchemy.exc import SQLAlchemyError
from src.shared import db
from src.user_service.models.user import User
from src.user_service.models.password_reset import PasswordReset
from src.user_service.services.email_service import EmailService
import logging

logger = logging.getLogger(__name__)

class PasswordService:
    TOKEN_LENGTH = 64  # Length of reset token
    TOKEN_EXPIRY_HOURS = 24  # Token validity period
    
    @staticmethod
    def create_reset_request(email: str) -> Tuple[Optional[Dict], Optional[str]]:
        """Create password reset request"""
        try:
            user = User.query.filter_by(email=email).first()
            
            if not user:
                return {'message': 'If email exists, reset instructions will be sent'}, None
                
            # Generate secure token
            token = secrets.token_urlsafe(PasswordService.TOKEN_LENGTH)
            expires_at = datetime.now(timezone.utc) + timedelta(hours=PasswordService.TOKEN_EXPIRY_HOURS)
            
            # Create reset request
            reset_request = PasswordReset(
                user_id=user.id,
                token=token,
                expires_at=expires_at
            )
            
            db.session.add(reset_request)
            db.session.commit()

            # Send email with reset instructions
            EmailService.send_password_reset_email(
                email=user.email,
                token=token,
                expiry=expires_at
            )
            
            return {
                'message': 'Reset instructions sent if email exists',
                'request_id': reset_request.id
            }, None
                
        except SQLAlchemyError as e:
            db.session.rollback()
            logger.error(f"Database error in create_reset_request: {str(e)}")
            return None, "Failed to create reset request"
            
    @staticmethod
    def reset_password(token: str, new_password: str) -> Tuple[bool, Optional[str]]:
        """Reset password using token"""
        try:
            # Find valid reset request
            reset_request = PasswordReset.query.filter(
                PasswordReset.token == token,
                PasswordReset.expires_at > datetime.now(timezone.utc),
                PasswordReset.used.is_(False)
            ).first()
            
            if not reset_request:
                return False, "Invalid or expired reset token"
                
            # Get user
            user = User.query.get(reset_request.user_id)
            if not user:
                return False, "User not found"
                
            # Update password
            user.set_password(new_password)
            reset_request.used = True
            reset_request.used_at = datetime.now(timezone.utc)
            
            db.session.commit()
            
            return True, None
            
        except SQLAlchemyError as e:
            db.session.rollback()
            logger.error(f"Database error in reset_password: {str(e)}")
            return False, "Failed to reset password"
            
    @staticmethod
    def change_password(user_id: int, current_password: str, new_password: str) -> Tuple[bool, Optional[str]]:
        """Change password for authenticated user"""
        try:
            user = User.query.get(user_id)
            if not user:
                return False, "User not found"
                
            # Verify current password
            if not user.check_password(current_password):
                return False, "Current password is incorrect"
                
            # Update password
            user.set_password(new_password)
            db.session.commit()
            
            return True, None
            
        except SQLAlchemyError as e:
            db.session.rollback()
            logger.error(f"Database error in change_password: {str(e)}")
            return False, "Failed to change password"

    @staticmethod
    def validate_password_strength(password: str) -> Tuple[bool, Optional[str]]:
        """Validate password meets security requirements"""
        if len(password) < 8:
            return False, "Password must be at least 8 characters long"
            
        if not any(c.isupper() for c in password):
            return False, "Password must contain at least one uppercase letter"
            
        if not any(c.islower() for c in password):
            return False, "Password must contain at least one lowercase letter"
            
        if not any(c.isdigit() for c in password):
            return False, "Password must contain at least one number"
            
        if not any(c in '!@#$%^&*()_+-=[]{}|;:,.<>?' for c in password):
            return False, "Password must contain at least one special character"
            
        return True, None