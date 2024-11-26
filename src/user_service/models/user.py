# src/user_service/models/user.py

from datetime import datetime, timezone
from src.shared import db
from werkzeug.security import generate_password_hash, check_password_hash
from sqlalchemy.ext.hybrid import hybrid_property
import logging
from typing import Tuple

logger = logging.getLogger(__name__)

class User(db.Model):
    """User model for storing user related details"""
    __tablename__ = 'users'

    # Keep all existing columns
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(64), unique=True, nullable=False, index=True)
    email = db.Column(db.String(120), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255))
    first_name = db.Column(db.String(64))
    last_name = db.Column(db.String(64))
    site_credits = db.Column(db.Float, default=0.0)
    is_active = db.Column(db.Boolean, default=True)
    is_verified = db.Column(db.Boolean, default=False)
    is_admin = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    last_login = db.Column(db.DateTime)
    phone_number = db.Column(db.String(20), unique=True, nullable=True)
    auth_provider = db.Column(db.String(20), default='local')
    google_id = db.Column(db.String(100), unique=True, nullable=True)

    # Add new verification columns
    verification_token = db.Column(db.String(64), unique=True, nullable=True)
    verification_token_expires = db.Column(db.DateTime, nullable=True)

    # Keep existing properties and methods
    @hybrid_property
    def requires_password(self):
        """Check if user requires password based on auth provider"""
        return self.auth_provider == 'local'
    
    def set_password(self, password):
        """Set password hash"""
        logger.debug(f"Setting password for user {self.username}")
        logger.debug(f"Auth provider: {self.auth_provider}")
        
        if not password:
            logger.error("Password cannot be empty")
            return False
            
        try:
            self.password_hash = generate_password_hash(password)
            logger.debug(f"Password hash set: {bool(self.password_hash)}")
            db.session.flush()  # Ensure the hash is written to the session
            return True
        except Exception as e:
            logger.error(f"Error setting password: {str(e)}")
            return False
    
    def check_password(self, password):
        """Check password"""
        logger.debug(f"Checking password for user {self.username}")
        logger.debug(f"Has password hash: {bool(self.password_hash)}")
        logger.debug(f"Auth provider: {self.auth_provider}")
        
        if not self.requires_password or not password or not self.password_hash:
            logger.debug("Password check failed: invalid conditions")
            return False
            
        try:
            result = check_password_hash(self.password_hash, password)
            logger.debug(f"Password check result: {result}")
            return result
        except Exception as e:
            logger.error(f"Error checking password: {str(e)}")
            return False

    def to_dict(self):
        """Convert user to dictionary"""
        from src.payment_service.services import PaymentService
        
        # Get current balance from payment service
        balance, _ = PaymentService.get_or_create_balance(self.id)
        
        return {
            'id': self.id,
            'username': self.username,
            'email': self.email,
            'first_name': self.first_name,
            'last_name': self.last_name,
            'phone_number': self.phone_number,
            'auth_provider': self.auth_provider,
            'is_verified': self.is_verified,
            'balance': {
                'available': float(balance.available_amount) if balance else 0.0,
                'pending': float(balance.pending_amount) if balance else 0.0,
                'last_updated': balance.last_updated.isoformat() if balance and balance.last_updated else None
            },
            'is_active': self.is_active,
            'is_admin': self.is_admin,
            'created_at': self.created_at.isoformat(),
            'last_login': self.last_login.isoformat() if self.last_login else None
        }

    # New verification methods
    def set_verification_token(self) -> Tuple[str, datetime]:
        """Set verification token and expiry"""
        from src.user_service.services.email_service import EmailService
        token, expiry = EmailService.generate_verification_token(self.id)
        self.verification_token = token
        self.verification_token_expires = expiry
        return token, expiry

    def clear_verification_token(self):
        """Clear verification token after use"""
        self.verification_token = None
        self.verification_token_expires = None