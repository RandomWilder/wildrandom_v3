# scripts/debug_password.py

import os
import sys
from pathlib import Path

project_root = str(Path(__file__).parent.parent)
sys.path.append(project_root)

from app import create_app
from src.shared import db
from src.user_service.models import User
from werkzeug.security import generate_password_hash, check_password_hash
import logging

logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

def debug_password_handling():
    """Debug password handling mechanism"""
    app = create_app('development')
    
    with app.app_context():
        try:
            # 1. List all users
            logger.info("----- All Users -----")
            users = User.query.all()
            logger.info(f"Found {len(users)} users")
            
            for user in users:
                logger.info(f"\nUser: {user.username} (ID: {user.id})")
                logger.info(f"Auth Provider: {user.auth_provider}")
                logger.info(f"Password Hash: {user.password_hash[:50]}..." if user.password_hash else "None")
                
                # Test direct hash comparison
                test_password = "Password123!"
                direct_hash = generate_password_hash(test_password)
                logger.info(f"\nTesting password for {user.username}:")
                logger.info(f"Direct Hash: {direct_hash[:50]}...")
                
                # Test both password check methods
                werkzeug_check = check_password_hash(user.password_hash, test_password) if user.password_hash else False
                model_check = user.check_password(test_password)
                
                logger.info(f"Werkzeug Check Result: {werkzeug_check}")
                logger.info(f"Model Check Result: {model_check}")
                logger.info("-" * 50)
            
            # 2. Test new user creation
            logger.info("\n----- Testing New User Creation -----")
            test_user = User(
                username="passwordtest",
                email="passwordtest@test.com",
                auth_provider="local"
            )
            
            # Log pre-hash state
            logger.info("Before setting password:")
            logger.info(f"Has password_hash: {bool(test_user.password_hash)}")
            
            # Set password
            test_user.set_password("Password123!")
            
            # Log post-hash state
            logger.info("\nAfter setting password:")
            logger.info(f"Has password_hash: {bool(test_user.password_hash)}")
            logger.info(f"Hash: {test_user.password_hash[:50]}..." if test_user.password_hash else "None")
            
            # Test verification
            verification = test_user.check_password("Password123!")
            logger.info(f"\nVerification result: {verification}")
            
            # Don't save test user - just rollback
            db.session.rollback()
            
        except Exception as e:
            logger.error(f"Debug process failed: {str(e)}")
            logger.exception("Detailed error:")
            db.session.rollback()
            raise

if __name__ == "__main__":
    logger.info("Starting password debug process...")
    debug_password_handling()