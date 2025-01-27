# src/api_gateway_service/routes/__init__.py

"""
API Gateway Route Management

Implements comprehensive route registration and management for the API Gateway service.
Handles both composite and proxy routes with proper dependency injection and error handling.

Architectural Considerations:
- Blueprint isolation for different route types
- Proper dependency injection for service components
- Consistent error handling across routes
- Cache strategy integration
- Request validation pipeline
"""

from typing import Optional
from flask import Flask, Blueprint
import logging
from datetime import datetime, timezone

from .composite_routes import composite_bp, CompositeRouteHandler
from .proxy_routes import proxy_bp, ProxyRouteHandler
from ..services.gateway_service import GatewayService
from ..cache.cache_manager import CacheManager
from ..transformers.response_transformer import ResponseTransformer
from ..validation.request_validator import validate_request

logger = logging.getLogger(__name__)

def init_routes(
    app: Flask,
    gateway_service: Optional[GatewayService] = None,
    cache_manager: Optional[CacheManager] = None
) -> None:
    """
    Initialize and register all route blueprints with proper dependency injection.
    
    Args:
        app: Flask application instance
        gateway_service: Optional pre-configured gateway service
        cache_manager: Optional pre-configured cache manager
        
    Architectural Considerations:
    - Maintains service boundaries
    - Enables route-specific middleware
    - Supports cache strategy configuration
    """
    try:
        logger.info(f"Initializing API Gateway routes at {datetime.now(timezone.utc)}")
        
        # Get or create service dependencies
        gateway_svc = gateway_service or app.gateway_service
        cache_mgr = cache_manager or app.cache_manager
        
        if not gateway_svc or not cache_mgr:
            raise ValueError("Required services not configured")

        # Create health check blueprint
        health_bp = Blueprint('health', __name__, url_prefix='/api/gateway')
        
        @health_bp.route('/health', methods=['GET'])
        def health_check():
            """Health check endpoint with service status"""
            try:
                return {
                    'status': 'healthy',
                    'timestamp': datetime.now(timezone.utc).isoformat(),
                    'version': '1.0.0',
                    'services': {
                        'gateway': True,
                        'cache': cache_mgr is not None,
                        'proxy': gateway_svc is not None
                    }
                }, 200
            except Exception as e:
                logger.error(f"Health check failed: {str(e)}")
                return {
                    'status': 'unhealthy',
                    'error': str(e),
                    'timestamp': datetime.now(timezone.utc).isoformat()
                }, 500

        # Initialize route handlers with dependencies
        composite_handler = CompositeRouteHandler(
            gateway_service=gateway_svc,
            cache_manager=cache_mgr
        )
        
        proxy_handler = ProxyRouteHandler(
            gateway_service=gateway_svc
        )

        # Register route blueprints
        app.register_blueprint(health_bp)
        app.register_blueprint(composite_bp)
        app.register_blueprint(proxy_bp)
        
        logger.info("Route registration completed successfully")
        
        # Log registered routes for debugging
        logger.debug("Registered routes:")
        for rule in app.url_map.iter_rules():
            logger.debug(f"{rule.endpoint}: {rule}")
            
    except Exception as e:
        logger.error(f"Failed to initialize routes: {str(e)}", exc_info=True)
        raise

def get_route_map() -> dict:
    """
    Get comprehensive route mapping for documentation generation.
    
    Returns:
        Dictionary containing route metadata for OpenAPI generation
        
    Architectural Considerations:
    - Supports documentation automation
    - Maintains route metadata
    - Enables frontend integration
    """
    return {
        'health': {
            'base_url': '/api/gateway',
            'blueprints': ['health'],
            'cache_enabled': False,
            'auth_required': False
        },
        'composite_routes': {
            'base_url': '/api/composite',
            'blueprints': [composite_bp],
            'cache_enabled': True,
            'auth_required': True
        },
        'proxy_routes': {
            'base_url': '/api',
            'blueprints': [proxy_bp],
            'cache_enabled': True,
            'auth_required': True
        }
    }

__all__ = [
    'composite_bp',
    'proxy_bp',
    'init_routes',
    'get_route_map',
    'CompositeRouteHandler',
    'ProxyRouteHandler'
]