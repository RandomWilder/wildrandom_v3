# scripts/reset_migrations.py

import os
import sys
from pathlib import Path

# Add project root to Python path
project_root = str(Path(__file__).parent.parent)
sys.path.append(project_root)

from app import create_app
from src.shared import db
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def reset_migrations():
    app = create_app()
    
    with app.app_context():
        try:
            # Drop alembic_version table using the newer SQLAlchemy syntax
            with db.engine.connect() as conn:
                conn.execute(db.text('DROP TABLE IF EXISTS alembic_version'))
                conn.commit()
            logger.info("Successfully reset alembic version")
        except Exception as e:
            logger.error(f"Error: {str(e)}")

if __name__ == "__main__":
    reset_migrations()