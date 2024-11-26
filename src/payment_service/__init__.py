# src/payment_service/__init__.py

from flask import Flask
from src.shared import db, migrate
from src.shared.config import config
import logging

logger = logging.getLogger(__name__)

def create_payment_service(app: Flask = None):
    """Initialize payment service"""
    if app is None:
        app = Flask(__name__)
        app.config.from_object(config['default'])
        
        # Initialize extensions
        db.init_app(app)
        migrate.init_app(app, db)
    
    logger.debug("Registering payment service routes...")
    
    # Register blueprints
    from src.payment_service.routes import register_routes
    register_routes(app)
    
    logger.debug("Payment service routes registered:")
    for rule in app.url_map.iter_rules():
        logger.debug(f"{rule.endpoint}: {rule}")
    
    return app

# Make models and services available at package level
from src.payment_service.models import (
    Transaction,
    TransactionType,
    TransactionStatus,
    ReferenceType,
    Balance,
    TransactionLog
)

from src.payment_service.services import (
    PaymentService,
    BalanceService,
    AuditService
)

__all__ = [
    'create_payment_service',
    # Models
    'Transaction',
    'TransactionType',
    'TransactionStatus',
    'ReferenceType',
    'Balance',
    'TransactionLog',
    # Services
    'PaymentService',
    'BalanceService',
    'AuditService'
]