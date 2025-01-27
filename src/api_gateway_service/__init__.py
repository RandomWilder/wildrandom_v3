# src/api_gateway_service/__init__.py

from flask import Flask
from redis import Redis
import logging
from typing import Optional
from datetime import datetime, timezone

from .services.gateway_service import GatewayService
from .services.proxy_service import ProxyService
from .transformers.response_transformer import ResponseTransformer
from .cache.cache_manager import CacheManager
from .routes import composite_bp, proxy_bp
from .documentation.openapi_generator import OpenAPIGenerator
from .documentation.schema_manager import SchemaManager

logger = logging.getLogger(__name__)

def create_app(config_name: str = 'default') -> Flask:
    """
    Application factory implementing clean architecture principles.
    Orchestrates component initialization and dependency injection.
    
    Args:
        config_name: Configuration environment name
        
    Returns:
        Configured Flask application instance
        
    Architectural Considerations:
    - Dependency injection for service components
    - Centralized error handling
    - Configuration isolation
    - Component lifecycle management
    """
    app = Flask(__name__)
    
    try:
        # Load configuration
        from src.shared.config import config
        app.config.from_object(config[config_name])
        
        # Initialize core services
        redis_client = Redis(
            host=app.config['REDIS_HOST'],
            port=app.config['REDIS_PORT'],
            db=app.config['REDIS_DB'],
            decode_responses=True
        )
        
        # Initialize components with dependency injection
        cache_manager = CacheManager(
            redis_client=redis_client,
            default_ttl=app.config.get('CACHE_DEFAULT_TTL', 300)
        )
        
        proxy_service = ProxyService(
            timeout_seconds=app.config.get('SERVICE_TIMEOUT', 30),
            max_retries=app.config.get('SERVICE_MAX_RETRIES', 3)
        )
        
        response_transformer = ResponseTransformer()
        
        gateway_service = GatewayService(
            cache_manager=cache_manager,
            response_transformer=response_transformer,
            proxy_service=proxy_service
        )
        
        # Initialize documentation components
        openapi = OpenAPIGenerator(
            title="WildRandom User API Gateway",
            version="1.0.0",
            description="API Gateway for WildRandom User Frontend"
        )
        
        schema_manager = SchemaManager()
        
        # Register components in app context
        app.cache_manager = cache_manager
        app.gateway_service = gateway_service
        app.openapi = openapi
        app.schema_manager = schema_manager
        
        # Register blueprints
        app.register_blueprint(composite_bp)
        app.register_blueprint(proxy_bp)
        
        # Initialize error handlers
        register_error_handlers(app)
        
        logger.info(f"API Gateway initialized successfully at {datetime.now(timezone.utc)}")
        return app
        
    except Exception as e:
        logger.critical(f"Failed to initialize API Gateway: {str(e)}", exc_info=True)
        raise

def register_error_handlers(app: Flask) -> None:
    """Register global error handlers for consistent error responses"""
    
    @app.errorhandler(Exception)
    def handle_exception(e):
        logger.error(f"Unhandled exception: {str(e)}", exc_info=True)
        return {
            'status': 'error',
            'error': 'Internal server error',
            'timestamp': datetime.now(timezone.utc).isoformat()
        }, 500

    # Add specific error handlers as needed