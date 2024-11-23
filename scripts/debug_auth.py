# scripts/debug_auth.py

import os
import sys
from pathlib import Path

# Add the project root directory to Python path
project_root = str(Path(__file__).parent.parent)
sys.path.append(project_root)

from app import create_app
from src.shared import db
from src.user_service.models import User
import logging

# Set up logging
logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

def debug_auth():
    """Debug authentication process"""
    app = create_app('development')
    
    with app.app_context():
        try:
            # 1. List all users in the database
            logger.info("----- All Users in Database -----")
            users = User.query.all()
            logger.info(f"Total users found: {len(users)}")
            
            for user in users:
                logger.info(f"\nUser Details:")
                logger.info(f"ID: {user.id}")
                logger.info(f"Username: {user.username}")
                logger.info(f"Email: {user.email}")
                logger.info(f"Auth Provider: {user.auth_provider}")
                logger.info(f"Has password hash: {bool(user.password_hash)}")
                if user.password_hash:
                    logger.info(f"Password hash: {user.password_hash[:20]}...")
                logger.info(f"Is Active: {user.is_active}")
                logger.info(f"Created At: {user.created_at}")
                logger.info("-" * 50)
            
            # 2. Try direct SQL query to verify
            logger.info("\n----- Direct SQL Query -----")
            result = db.session.execute(db.text("SELECT id, username, email, password_hash IS NOT NULL as has_password FROM users"))
            rows = result.fetchall()
            logger.info(f"Users found via SQL: {len(rows)}")
            for row in rows:
                logger.info(f"ID: {row[0]}, Username: {row[1]}, Email: {row[2]}, Has Password: {row[3]}")
            
            # 3. Check database connection details
            logger.info("\n----- Database Connection -----")
            logger.info(f"Database name: {app.config['DB_NAME']}")
            logger.info(f"Database host: {app.config['DB_HOST']}")
            
        except Exception as e:
            logger.error(f"Debug process failed: {str(e)}")
            logger.exception("Detailed error:")
            db.session.rollback()
            raise

if __name__ == "__main__":
    logger.info("Starting authentication debug process...")
    debug_auth()