# scripts/reset_admin.py

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

def reset_admin():
    """Reset admin password and verify settings"""
    app = create_app('development')
    
    with app.app_context():
        try:
            # Find admin user
            admin = User.query.filter_by(username='Admin').first()
            
            if not admin:
                logger.error("Admin user not found!")
                return
            
            # Reset settings
            admin.is_admin = True
            admin.is_active = True
            admin.auth_provider = 'local'
            
            # Set new password
            password = "Admin!@#123"
            if admin.set_password(password):
                logger.info("Password reset successful")
                
                # Verify password
                if admin.check_password(password):
                    logger.info("Password verification successful")
                else:
                    logger.error("Password verification failed!")
            else:
                logger.error("Failed to set password!")
            
            db.session.commit()
            
            logger.info("\n=== Updated Admin Details ===")
            logger.info(f"Username: {admin.username}")
            logger.info(f"Email: {admin.email}")
            logger.info(f"Is Admin: {admin.is_admin}")
            logger.info(f"Is Active: {admin.is_active}")
            logger.info(f"Auth Provider: {admin.auth_provider}")
            logger.info(f"Has Password Hash: {bool(admin.password_hash)}")
            
        except Exception as e:
            db.session.rollback()
            logger.error(f"Reset failed: {str(e)}")
            raise

if __name__ == "__main__":
    logger.info("Starting admin reset...")
    reset_admin()