# scripts/check_db.py

import os
import sys
from pathlib import Path

project_root = str(Path(__file__).parent.parent)
sys.path.append(project_root)

from app import create_app
from src.shared import db
import logging

logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

def check_database():
    """Check database configuration and tables"""
    app = create_app('development')
    
    with app.app_context():
        try:
            # 1. Check connection and database info
            logger.info("----- Database Configuration -----")
            logger.info(f"Database URI: {app.config['SQLALCHEMY_DATABASE_URI']}")
            logger.info(f"Database Name: {app.config['DB_NAME']}")
            
            # 2. List all tables
            logger.info("\n----- Database Tables -----")
            result = db.session.execute(db.text("SHOW TABLES"))
            tables = result.fetchall()
            logger.info(f"Total tables found: {len(tables)}")
            for table in tables:
                logger.info(f"Table: {table[0]}")
                
                # Show table structure
                structure = db.session.execute(db.text(f"DESCRIBE {table[0]}"))
                logger.info("Columns:")
                for col in structure:
                    logger.info(f"  - {col[0]}: {col[1]}")
                logger.info("-" * 50)
            
            # 3. Check if tables are empty
            logger.info("\n----- Table Records -----")
            for table in tables:
                count = db.session.execute(db.text(f"SELECT COUNT(*) FROM {table[0]}")).scalar()
                logger.info(f"Table {table[0]}: {count} records")
            
        except Exception as e:
            logger.error(f"Database check failed: {str(e)}")
            logger.exception("Detailed error:")
            raise

if __name__ == "__main__":
    logger.info("Starting database check...")
    check_database()