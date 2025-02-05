# scripts/schema_migration_manager.py

"""
Schema Migration Manager
Handles safe schema migrations with dialect-specific implementations.
"""

import os
import sys
from pathlib import Path
import logging
from datetime import datetime
import sqlalchemy as sa
from sqlalchemy import create_engine, inspect, text, MetaData
from flask import Flask
from typing import Optional, List, Dict

# Project setup
project_root = str(Path(__file__).parent.parent)
sys.path.append(project_root)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class SchemaMigrationManager:
    def __init__(self):
        """Initialize with Flask context for proper SQLAlchemy setup"""
        from src.shared import db
        from src.shared.config import config
        
        # Initialize Flask context
        self.app = Flask(__name__)
        self.app.config.from_object(config['default'])
        db.init_app(self.app)
        
        with self.app.app_context():
            self.db = db
            self.engine = db.engine
            self.inspector = inspect(self.engine)
            self.metadata = MetaData()

    def _get_mysql_create_table_sql(self) -> str:
        """Get MySQL-specific create table SQL"""
        return """
        CREATE TABLE user_protection_settings (
            user_id INT NOT NULL,
            daily_max_tickets INT NOT NULL DEFAULT 50,
            max_tickets_per_raffle INT NOT NULL DEFAULT 10,
            daily_spend_limit DECIMAL(10,2) NOT NULL DEFAULT 100.00,
            cool_down_minutes INT NOT NULL DEFAULT 0,
            last_purchase_time DATETIME NULL,
            require_2fa_above DECIMAL(10,2) NULL,
            updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            PRIMARY KEY (user_id),
            CONSTRAINT fk_user_protection_settings_user
                FOREIGN KEY (user_id) 
                REFERENCES users(id)
                ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        """

    def create_user_protection_settings_table(self) -> bool:
        """Create user_protection_settings table with MySQL optimizations"""
        try:
            with self.app.app_context():
                # Verify table doesn't exist
                if 'user_protection_settings' in self.inspector.get_table_names():
                    logger.error("Table already exists")
                    return False

                # Create table
                create_table_sql = self._get_mysql_create_table_sql()
                with self.engine.begin() as conn:
                    conn.execute(text(create_table_sql))
                    
                    # Create index
                    conn.execute(text("""
                        CREATE INDEX idx_protection_settings_user 
                        ON user_protection_settings(user_id);
                    """))

                # Verify
                success = self.verify_table_creation()
                if success:
                    logger.info("Table created and verified successfully")
                return success

        except Exception as e:
            logger.error(f"Migration failed: {str(e)}")
            return False

    def verify_table_creation(self) -> bool:
        """Verify table structure with detailed validation"""
        try:
            with self.app.app_context():
                # Check table existence
                if 'user_protection_settings' not in self.inspector.get_table_names():
                    logger.error("Table does not exist")
                    return False

                # Validate columns
                columns = {c['name']: c for c in self.inspector.get_columns('user_protection_settings')}
                required_columns = {
                    'user_id': {'type': sa.Integer, 'nullable': False},
                    'daily_max_tickets': {'type': sa.Integer, 'nullable': False},
                    'max_tickets_per_raffle': {'type': sa.Integer, 'nullable': False},
                    'daily_spend_limit': {'type': sa.DECIMAL, 'nullable': False},
                    'cool_down_minutes': {'type': sa.Integer, 'nullable': False},
                    'last_purchase_time': {'type': sa.DateTime, 'nullable': True},
                    'require_2fa_above': {'type': sa.DECIMAL, 'nullable': True},
                    'updated_at': {'type': sa.DateTime, 'nullable': False}
                }

                for col_name, requirements in required_columns.items():
                    if col_name not in columns:
                        logger.error(f"Missing column: {col_name}")
                        return False
                
                # Validate foreign key
                fkeys = self.inspector.get_foreign_keys('user_protection_settings')
                if not any(fk['referred_table'] == 'users' for fk in fkeys):
                    logger.error("Missing foreign key to users table")
                    return False

                # Validate index
                indexes = self.inspector.get_indexes('user_protection_settings')
                if not any(idx['name'] == 'idx_protection_settings_user' for idx in indexes):
                    logger.error("Missing required index")
                    return False

                logger.info("Table structure verified successfully")
                return True

        except Exception as e:
            logger.error(f"Verification failed: {str(e)}")
            return False

def main():
    """CLI interface for schema migrations"""
    if len(sys.argv) < 2:
        print("Usage: python schema_migration_manager.py [create_table|verify]")
        return

    manager = SchemaMigrationManager()
    command = sys.argv[1]

    if command == 'create_table':
        if len(sys.argv) != 3:
            print("Usage: python schema_migration_manager.py create_table <table_name>")
            return
            
        table_name = sys.argv[2]
        if table_name == 'user_protection_settings':
            success = manager.create_user_protection_settings_table()
            sys.exit(0 if success else 1)
    
    elif command == 'verify':
        success = manager.verify_table_creation()
        print(f"Table verification: {'SUCCESS' if success else 'FAILED'}")
        sys.exit(0 if success else 1)

if __name__ == "__main__":
    main()