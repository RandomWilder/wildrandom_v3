from .admin_routes import admin_bp
from .public_routes import public_bp

def register_routes(app):
    """Register all raffle service routes"""
    app.register_blueprint(admin_bp)
    app.register_blueprint(public_bp)

__all__ = [
    'admin_bp',
    'public_bp',
    'register_routes'
]