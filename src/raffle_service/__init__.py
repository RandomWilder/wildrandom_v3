from flask import Flask
from src.shared import db, migrate
from src.shared.config import config
import logging

logger = logging.getLogger(__name__)

def create_raffle_service(app: Flask = None):
    """Initialize raffle service"""
    if app is None:
        app = Flask(__name__)
        app.config.from_object(config['default'])
        
        # Initialize extensions
        db.init_app(app)
        migrate.init_app(app, db)
    
    logger.debug("Registering raffle service routes...")
    
    # Register blueprints with proper URL prefixes
    from src.raffle_service.routes import register_routes
    register_routes(app)
    
    logger.debug("Registered raffle service routes:")
    for rule in app.url_map.iter_rules():
        logger.debug(f"{rule.endpoint}: {rule}")
    
    return app

# Make models and services available at package level
from src.raffle_service.models import (
    Raffle,
    RaffleStatus,
    RaffleState,
    Ticket,
    TicketStatus,
    RaffleDraw,
    DrawResult,
    RaffleHistory
)

from src.raffle_service.services import (
    RaffleService,
    TicketService,
    DrawService,
    StateService
)

__all__ = [
    'create_raffle_service',
    # Models
    'Raffle',
    'RaffleStatus',
    'RaffleState',
    'Ticket',
    'TicketStatus',
    'RaffleDraw',
    'DrawResult',
    'RaffleHistory',
    # Services
    'RaffleService',
    'TicketService',
    'DrawService',
    'StateService'
]