# src/shared/__init__.py

from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate

# Initialize extensions
db = SQLAlchemy()
migrate = Migrate()

def init_db(app):
    """Initialize database and migrations"""
    db.init_app(app)
    migrate.init_app(app, db)

# Import configuration
from .config import config

__all__ = ['db', 'migrate', 'init_db', 'config']