# app.py

from flask import Flask
from src.shared import init_db, config
from src.user_service import create_user_service, User
import os
import logging
from logging.handlers import RotatingFileHandler

# Set up logging
logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

def create_app(config_name=None):
    """Application factory function"""
    app = Flask(__name__)
    
    # Load configuration
    if config_name is None:
        config_name = os.getenv('FLASK_ENV', 'development')
    app.config.from_object(config[config_name])
    
    # Initialize extensions
    init_db(app)
    
    # Register blueprints
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
    
    return app

# Create the application instance
app = create_app()

if __name__ == '__main__':
    app.run(debug=True)