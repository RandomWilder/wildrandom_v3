# src/user_service/__init__.py

from flask import Flask
from src.shared import db, migrate
from src.shared.config import config
from src.user_service.routes.user_routes import user_bp
from src.user_service.routes.password_routes import password_bp
import logging

logger = logging.getLogger(__name__)

def create_user_service(config_name='default'):
    """Initialize user service"""
    app = Flask(__name__)
    app.config.from_object(config[config_name])
    
    # Initialize extensions
    db.init_app(app)
    migrate.init_app(app, db)
    
    logger.debug("Registering user service blueprints...")
    
    # Register blueprints with proper URL prefixes
    app.register_blueprint(user_bp, url_prefix='/api/users')
    app.register_blueprint(password_bp, url_prefix='/api/users/password')
    
    logger.debug("Registered user service routes:")
    for rule in app.url_map.iter_rules():
        logger.debug(f"{rule.endpoint}: {rule}")
    
    return app

# Make models available at package level
from src.user_service.models import (
    User,
    UserStatusChange,
    UserActivity,
    CreditTransaction
)

__all__ = [
    'create_user_service',
    'User',
    'UserStatusChange',
    'UserActivity',
    'CreditTransaction'
]