from flask import Flask
from src.shared import db, migrate
from src.shared.config import config

def create_prize_center_service(app: Flask = None):
    """Initialize prize center service"""
    if app is None:
        app = Flask(__name__)
        app.config.from_object(config['default'])
        
        # Initialize extensions
        db.init_app(app)
        migrate.init_app(app, db)
    
    # Register blueprints
    from src.prize_center_service.routes import admin_prizes_bp, public_prizes_bp
    app.register_blueprint(admin_prizes_bp)
    app.register_blueprint(public_prizes_bp)
    
    return app

# Make models available at package level
from src.prize_center_service.models import (
    PrizeTemplate,
    PrizePool,
    PrizeInstance,
    InstantWinInstance,
    DrawWinInstance
)

__all__ = [
    'create_prize_center_service',
    'PrizeTemplate',
    'PrizePool',
    'PrizeInstance',
    'InstantWinInstance',
    'DrawWinInstance'
]