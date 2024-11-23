# src/user_service/services/email_service.py

from datetime import datetime, timezone, timedelta
import secrets
from typing import Optional, Tuple, Dict
from src.shared import db
import logging

logger = logging.getLogger(__name__)

class EmailConfig:
    """Email configuration"""
    # Development mode (default for now)
    DEV_MODE = True
    
    # Email verification settings
    VERIFICATION_EXPIRE_HOURS = 24
    VERIFICATION_TOKEN_LENGTH = 32
    
    # Future SMTP settings (when ready)
    SMTP_HOST = "smtp.wildrandom.com"
    SMTP_PORT = 587
    SMTP_USER = "noreply@wildrandom.com"
    SMTP_PASSWORD = "your_smtp_password"

class EmailService:
    # Keep existing methods unchanged
    @staticmethod
    def send_password_reset_email(email: str, token: str, expiry: datetime) -> None:
        """Send password reset email (development version - logs instead of sending)"""
        logger.info("\n")
        logger.info("="*50)
        logger.info("PASSWORD RESET EMAIL - DEVELOPMENT MODE")
        logger.info("="*50)
        logger.info(f"TO: {email}")
        logger.info(f"RESET TOKEN: {token}")
        logger.info(f"EXPIRES AT: {expiry}")
        logger.info(f"RESET LINK: http://localhost:3000/reset-password?token={token}")
        logger.info("="*50)
        logger.info("\n")

    @staticmethod
    def send_welcome_email(email: str, username: str) -> None:
        """Send welcome email to new users"""
        logger.info("\n")
        logger.info("="*50)
        logger.info("WELCOME EMAIL - DEVELOPMENT MODE")
        logger.info("="*50)
        logger.info(f"TO: {email}")
        logger.info(f"Welcome {username}!")
        logger.info("Thank you for registering with our service.")
        logger.info("="*50)
        logger.info("\n")

    @staticmethod
    def send_verification_email(user_id: int, email: str, token: str) -> None:
        """Send email verification code with enhanced functionality"""
        logger.info("\n")
        logger.info("="*50)
        logger.info("VERIFICATION EMAIL - DEVELOPMENT MODE")
        logger.info("="*50)
        logger.info(f"TO: {email}")
        logger.info(f"VERIFICATION TOKEN: {token}")
        logger.info(f"VERIFICATION LINK: http://localhost:3000/verify-email?token={token}")
        logger.info(f"Expires in: {EmailConfig.VERIFICATION_EXPIRE_HOURS} hours")
        logger.info("="*50)
        logger.info("\n")

    # New methods for enhanced verification
    @staticmethod
    def generate_verification_token(user_id: int) -> Tuple[str, datetime]:
        """Generate verification token and expiry"""
        token = secrets.token_urlsafe(EmailConfig.VERIFICATION_TOKEN_LENGTH)
        expiry = datetime.now(timezone.utc) + timedelta(hours=EmailConfig.VERIFICATION_EXPIRE_HOURS)
        return token, expiry

    @staticmethod
    def send_verification_request(user_id: int, email: str) -> Tuple[bool, Optional[str]]:
        """Handle full verification request process"""
        try:
            token, expiry = EmailService.generate_verification_token(user_id)
            EmailService.send_verification_email(user_id, email, token)
            return True, token
        except Exception as e:
            logger.error(f"Failed to send verification request: {str(e)}")
            return False, str(e)