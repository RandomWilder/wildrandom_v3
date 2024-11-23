# scripts/cleanup_db.py

import os
import sys
from pathlib import Path

project_root = str(Path(__file__).parent.parent)
sys.path.append(project_root)

from app import create_app
from src.shared import db
from src.user_service.models import User, UserActivity, UserStatusChange, CreditTransaction, PasswordReset
import logging

logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

def cleanup_database():
    """Clean up the database for fresh testing"""
    app = create_app('development')
    
    with app.app_context():
        try:
            logger.info("Starting database cleanup...")
            
            # Delete records from dependent tables first
            logger.info("Cleaning up dependent tables...")
            
            # User Activities
            count = UserActivity.query.delete()
            logger.info(f"Deleted {count} user activities")
            
            # User Status Changes
            count = UserStatusChange.query.delete()
            logger.info(f"Deleted {count} status changes")
            
            # Credit Transactions
            count = CreditTransaction.query.delete()
            logger.info(f"Deleted {count} credit transactions")
            
            # Password Resets
            count = PasswordReset.query.delete()
            logger.info(f"Deleted {count} password resets")
            
            # Finally, delete users
            count = User.query.delete()
            logger.info(f"Deleted {count} users")
            
            # Reset auto-increment counters
            logger.info("Resetting auto-increment counters...")
            tables = ['users', 'user_activities', 'user_status_changes', 
                     'credit_transactions', 'password_resets']
            
            for table in tables:
                db.session.execute(db.text(f"ALTER TABLE {table} AUTO_INCREMENT = 1"))
            
            db.session.commit()
            logger.info("Database cleanup completed successfully")
            
        except Exception as e:
            logger.error(f"Cleanup failed: {str(e)}")
            db.session.rollback()
            raise

if __name__ == "__main__":
    logger.info("Starting database cleanup process...")
    cleanup_database()