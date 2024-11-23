# scripts/verify_admin.py

import os
import sys
from pathlib import Path
import logging

project_root = str(Path(__file__).parent.parent)
sys.path.append(project_root)

from app import create_app
from src.shared import db
from src.user_service.models import User

logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

def verify_admin():
    """Verify admin user in database"""
    app = create_app('development')
    
    with app.app_context():
        try:
            # Find admin user
            admin = User.query.filter_by(username='Admin').first()
            
            if not admin:
                logger.error("Admin user not found in database!")
                return
            
            logger.info("=== Admin User Details ===")
            logger.info(f"ID: {admin.id}")
            logger.info(f"Username: {admin.username}")
            logger.info(f"Email: {admin.email}")
            logger.info(f"Is Admin Flag: {admin.is_admin}")
            logger.info(f"Is Active: {admin.is_active}")
            logger.info(f"Auth Provider: {admin.auth_provider}")
            logger.info(f"Has Password Hash: {bool(admin.password_hash)}")
            if admin.password_hash:
                logger.info(f"Password Hash Start: {admin.password_hash[:20]}...")
            
            # Test password verification
            test_result = admin.check_password("Admin!@#123")
            logger.info(f"\nPassword Check Result: {test_result}")
            
            # Additional debug info
            logger.info("\n=== Debug Info ===")
            logger.info(f"Requires Password: {admin.requires_password}")
            
        except Exception as e:
            logger.error(f"Verification failed: {str(e)}")
            raise

if __name__ == "__main__":
    logger.info("Starting admin verification...")
    verify_admin()