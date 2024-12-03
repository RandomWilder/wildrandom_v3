"""
Main application factory module.
Handles initialization and configuration of all services including TaskScheduler.
"""

from flask import Flask
from src.shared import init_db, config
import os
import logging
from logging.handlers import RotatingFileHandler
import threading
from src.taskscheduler_service import init_task_scheduler

# Set up logging
logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

def create_app(config_name: str | None = None, register_blueprints: bool = True) -> Flask:
    """
    Application factory function with comprehensive service initialization.
    
    Args:
        config_name: Configuration environment to use (development/production/testing)
        register_blueprints: Whether to register service blueprints
        
    Returns:
        Flask: Configured Flask application instance
    """
    app = Flask(__name__)

    # Load configuration
    if config_name is None:
        config_name = os.getenv('FLASK_ENV', 'development')
    app.config.from_object(config[config_name])

    # Initialize extensions
    init_db(app)
    
    # Initialize TaskScheduler service
    init_task_scheduler(app)

    if register_blueprints:
        # Register User Service blueprints
        from src.user_service.routes.user_routes import user_bp
        from src.user_service.routes.password_routes import password_bp
        from src.user_service.routes.admin_auth_routes import admin_auth_bp
        from src.user_service.routes.loyalty_routes import loyalty_bp
        from src.user_service.routes.verification_routes import verification_bp
        
        app.register_blueprint(user_bp)
        app.register_blueprint(password_bp)
        app.register_blueprint(admin_auth_bp)
        app.register_blueprint(loyalty_bp)
        app.register_blueprint(verification_bp)

        # Register Prize Center Service blueprints
        from src.prize_center_service.routes.admin_routes import admin_prizes_bp
        from src.prize_center_service.routes.public_routes import public_prizes_bp
        
        app.register_blueprint(admin_prizes_bp)
        app.register_blueprint(public_prizes_bp)

        # Register Raffle Service blueprints
        from src.raffle_service.routes import register_routes
        register_routes(app)

        # Register Payment Service blueprints
        from src.payment_service.routes import register_routes as register_payment_routes
        register_payment_routes(app)

        logger.info("All service blueprints registered successfully")

    return app

def start_background_tasks(app: Flask) -> None:
    """
    Start background tasks with application context.
    
    Args:
        app: Flask application instance
    """
    with app.app_context():
        # Start cleanup task in background thread
        from src.raffle_service.tasks.cleanup_task import start_cleanup_scheduler
        cleanup_thread = threading.Thread(target=start_cleanup_scheduler)
        cleanup_thread.daemon = True
        cleanup_thread.start()
        logger.info("Started reservation cleanup background task")

# Create the application instance
app = create_app()

if __name__ == '__main__':
    start_background_tasks(app)
    app.run(debug=True)