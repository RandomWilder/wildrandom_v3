# scripts/create_admin.py

import os
import sys
from pathlib import Path
import logging

# Add project root to Python path
project_root = str(Path(__file__).parent.parent)
sys.path.append(project_root)

from app import create_app
from src.shared import db
from src.user_service.models import User
from src.user_service.services.activity_service import ActivityService

logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

def create_admin_user():
    """Create an admin user"""
    app = create_app('development')
    
    with app.app_context():
        # Start transaction
        try:
            logger.info("=== Admin User Creation ===")
            
            # Get admin details
            username = input("Enter admin username: ")
            email = input("Enter admin email: ")
            password = input("Enter admin password: ")
            confirm_password = input("Confirm admin password: ")
            
            # Validate input
            if password != confirm_password:
                logger.error("Passwords do not match!")
                return False
                
            if len(password) < 8:
                logger.error("Password must be at least 8 characters!")
                return False
            
            # Create admin user
            admin = User(
                username=username,
                email=email,
                is_admin=True,
                is_active=True,
                is_verified=True,
                auth_provider='local'
            )
            
            logger.info("Setting admin password...")
            if not admin.set_password(password):
                logger.error("Failed to set admin password!")
                return False
            
            logger.info("Adding admin to database...")
            db.session.add(admin)
            db.session.flush()  # Flush to get the ID
            
            logger.info(f"Admin user ID: {admin.id}")
            
            # Commit the admin user first
            db.session.commit()
            logger.info("Admin user committed to database.")
            
            # Verify admin was created
            created_admin = User.query.filter_by(username=username).first()
            if not created_admin:
                logger.error("Failed to find admin after creation!")
                db.session.rollback()
                return False
            
            # Create activity log
            try:
                activity = ActivityService.log_activity(
                    user_id=created_admin.id,  # Now we have the ID
                    activity_type='admin_creation',
                    request=None,
                    status='success',
                    details={'username': username}
                )
                logger.info("Activity log created successfully")
            except Exception as e:
                logger.error(f"Activity log creation failed: {str(e)}")
                # Continue even if activity logging fails
            
            # Final verification
            logger.info("\n=== Admin Created Successfully ===")
            logger.info(f"Username: {username}")
            logger.info(f"Email: {email}")
            logger.info(f"Password: {password}")
            logger.info(f"ID: {created_admin.id}")
            logger.info(f"Is Admin: {created_admin.is_admin}")
            logger.info(f"Is Active: {created_admin.is_active}")
            
            # Test password verification
            test_result = created_admin.check_password(password)
            logger.info(f"Password verification test: {'Success' if test_result else 'Failed'}")
            
            if test_result:
                logger.info("\nAdmin creation completed successfully!")
                return True
            else:
                logger.error("Password verification failed!")
                return False
                
        except Exception as e:
            db.session.rollback()
            logger.error(f"Failed to create admin user: {str(e)}")
            return False

if __name__ == "__main__":
    logger.info("Starting admin creation process...")
    success = create_admin_user()
    if success:
        # Try immediate verification
        logger.info("\nVerifying admin user...")
        app = create_app('development')
        with app.app_context():
            admin = User.query.filter_by(is_admin=True).first()
            if admin:
                logger.info(f"Successfully verified admin: {admin.username}")
            else:
                logger.error("Could not verify admin user!")