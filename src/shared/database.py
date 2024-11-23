from flask import Flask
import logging
from . import db, migrate

logger = logging.getLogger(__name__)

def init_db(app: Flask) -> None:
    """Initialize database with application context"""
    try:
        db.init_app(app)
        migrate.init_app(app, db)
        
        # Create tables if they don't exist (development only)
        if app.config.get('FLASK_ENV') == 'development':
            with app.app_context():
                db.create_all()
                
        logger.info("Database initialized successfully")
    except Exception as e:
        logger.error(f"Error initializing database: {str(e)}")
        raise