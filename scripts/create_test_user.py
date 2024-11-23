# scripts/create_test_user.py

import os
import sys
from pathlib import Path

project_root = str(Path(__file__).parent.parent)
sys.path.append(project_root)

from app import create_app
from src.shared import db
from src.user_service.models import User
import logging

logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

def create_test_user():
    """Create a test user with debug logging"""
    app = create_app('development')
    
    with app.app_context():
        try:
            # 1. Create user
            logger.info("----- Creating Test User -----")
            user = User(
                username="debuguser",
                email="debug@test.com",
                first_name="Debug",
                last_name="User",
                auth_provider="local"
            )
            
            # 2. Set password with logging
            logger.info("Setting password...")
            user.set_password("DebugPass123!")
            logger.info(f"Password hash created: {bool(user.password_hash)}")
            
            # 3. Add to session
            logger.info("Adding user to database session...")
            db.session.add(user)
            
            # 4. Commit with error checking
            logger.info("Committing to database...")
            db.session.commit()
            
            # 5. Verify user was created
            created_user = User.query.filter_by(username="debuguser").first()
            logger.info("\n----- Verification -----")
            logger.info(f"User found in database: {bool(created_user)}")
            if created_user:
                logger.info(f"ID: {created_user.id}")
                logger.info(f"Username: {created_user.username}")
                logger.info(f"Has password: {bool(created_user.password_hash)}")
            
            return created_user
            
        except Exception as e:
            logger.error(f"User creation failed: {str(e)}")
            logger.exception("Detailed error:")
            db.session.rollback()
            raise

if __name__ == "__main__":
    logger.info("Starting test user creation...")
    create_test_user()