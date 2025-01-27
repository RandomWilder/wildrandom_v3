"""
Routes initialization module.
Handles blueprint registration and route configuration.
"""

from .admin_routes import admin_bp
from .public_routes import public_raffle_bp

def register_routes(app):
    """Register all raffle service routes"""
    app.register_blueprint(admin_bp)
    app.register_blueprint(public_raffle_bp)

__all__ = [
    'admin_bp',
    'public_raffle_bp',
    'register_routes'
]