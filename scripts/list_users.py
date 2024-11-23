# scripts/list_users.py

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

def list_users():
    """List all users and test their credentials"""
    app = create_app('development')
    
    with app.app_context():
        try:
            logger.info("----- All Users in Database -----")
            users = User.query.all()
            logger.info(f"Total users found: {len(users)}")
            
            for user in users:
                logger.info("\nUser Details:")
                logger.info(f"ID: {user.id}")
                logger.info(f"Username: {user.username}")
                logger.info(f"Email: {user.email}")
                logger.info(f"Auth Provider: {user.auth_provider}")
                logger.info(f"Has password hash: {bool(user.password_hash)}")
                logger.info(f"Password hash: {user.password_hash[:20]}..." if user.password_hash else "None")
                logger.info(f"Requires password: {user.requires_password}")
                logger.info(f"Is Active: {user.is_active}")
                logger.info("-" * 50)
                
                # Test authentication
                if user.username == "debuguser":
                    logger.info("Testing authentication for debug user:")
                    test_result = user.check_password("DebugPass123!")
                    logger.info(f"Password check result: {test_result}")
                
            logger.info("\n----- Database Connection Info -----")
            logger.info(f"Database name: {app.config['DB_NAME']}")
            logger.info(f"Number of users: {len(users)}")
            
        except Exception as e:
            logger.error(f"Listing users failed: {str(e)}")
            logger.exception("Detailed error:")
            raise

if __name__ == "__main__":
    logger.info("Starting user listing...")
    list_users()