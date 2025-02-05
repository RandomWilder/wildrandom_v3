# src/user_service/__init__.py

from flask import Flask
from src.shared import db, migrate
from src.shared.config import config
import logging

# Configure service-level logging
logger = logging.getLogger(__name__)

# Import all route blueprints
from src.user_service.routes.user_routes import user_bp
from src.user_service.routes.password_routes import password_bp
from src.user_service.routes.protection_routes import protection_bp
from src.user_service.routes.oauth_routes import oauth_bp
from src.user_service.routes.verification_routes import verification_bp
from src.user_service.routes.loyalty_routes import loyalty_bp
from src.user_service.routes.admin_auth_routes import admin_auth_bp

def create_user_service(config_name='default'):
    """
    Initialize user service with comprehensive route registration and proper error handling.
    
    Args:
        config_name (str): Configuration environment name
        
    Returns:
        Flask: Configured Flask application instance
        
    Note:
        Implements complete user service functionality including:
        - Authentication & Authorization
        - User Management
        - Protection Settings
        - OAuth Integration
        - Email Verification
        - Loyalty System
        - Administrative Controls
    """
    app = Flask(__name__)
    app.config.from_object(config[config_name])
    
    # Initialize database extensions
    db.init_app(app)
    migrate.init_app(app, db)
    
    logger.info("Initializing User Service...")
    logger.debug("Registering service blueprints...")
    
    # Define blueprint registration configuration
    # This centralized configuration ensures consistent URL prefixing
    # and makes route management more maintainable
    blueprint_configs = [
        # Core user management
        (user_bp, '/api/users'),
        (password_bp, '/api/users/password'),
        
        # Security and protection
        (protection_bp, '/api/users/protection'),
        (verification_bp, '/api/users/verify'),
        
        # Authentication flows
        (oauth_bp, '/api/auth'),
        
        # Engagement features
        (loyalty_bp, '/api/users/loyalty'),
        
        # Administrative interface
        (admin_auth_bp, '/api/admin')
    ]

    # Register blueprints with proper URL prefixes
    for blueprint, url_prefix in blueprint_configs:
        app.register_blueprint(blueprint, url_prefix=url_prefix)
        logger.debug(f"✓ Registered {blueprint.name} at {url_prefix}")
    
    # Log all registered routes for debugging
    if app.debug:
        logger.debug("Registered routes:")
        for rule in app.url_map.iter_rules():
            logger.debug(f"  {rule.endpoint}: {rule.rule} [{', '.join(rule.methods)}]")
    
    logger.info("User Service initialization complete")
    return app

# Make core models available at package level for easy imports
from src.user_service.models import (
    # User management
    User,
    UserStatusChange,
    UserActivity,
    
    # Financial tracking
    CreditTransaction,
    
    # Security
    PasswordReset,
    
    # Engagement
    UserLoyalty,
    LoyaltyHistory,
    
    # Protection
    UserProtectionSettings
)

# Export public interface
__all__ = [
    # Service factory
    'create_user_service',
    
    # Core models
    'User',
    'UserStatusChange',
    'UserActivity',
    'CreditTransaction',
    'PasswordReset',
    
    # Engagement models
    'UserLoyalty',
    'LoyaltyHistory',
    
    # Protection models
    'UserProtectionSettings'
]