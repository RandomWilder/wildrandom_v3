"""Test configuration and fixtures for raffle draw tests"""

import os
import sys
import pytest
from pathlib import Path

# Add project root to Python path
project_root = str(Path(__file__).parent.parent.parent.parent)
sys.path.append(project_root)

from app import create_app
from src.shared import db

@pytest.fixture(scope="session")
def app():
    """Create test application"""
    app = create_app('testing')
    return app

@pytest.fixture(scope="session")
def _db(app):
    """Provide test database"""
    with app.app_context():
        db.create_all()
        yield db
        db.session.remove()
        db.drop_all()

@pytest.fixture(scope="function")
def session(_db):
    """Provide test database session"""
    connection = _db.engine.connect()
    transaction = connection.begin()
    session = _db.session
    
    yield session
    
    session.close()
    transaction.rollback()
    connection.close()