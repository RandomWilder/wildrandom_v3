# src/payment_service/routes/__init__.py

from .public_routes import public_bp
from .admin_routes import admin_bp

def register_routes(app):
    """Register all payment service routes"""
    app.register_blueprint(public_bp)
    app.register_blueprint(admin_bp)

__all__ = [
    'public_bp',
    'admin_bp',
    'register_routes'
]