# scripts/revise_protection_settings.py

from pathlib import Path
import sys
import logging
from sqlalchemy import text
from typing import Dict, Tuple

project_root = str(Path(__file__).parent.parent)
sys.path.append(project_root)

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class ProtectionSettingsRevision:
    def __init__(self):
        from flask import Flask
        from src.shared import db
        from src.shared.config import config
        
        self.app = Flask(__name__)
        self.app.config.from_object(config['default'])
        db.init_app(self.app)
        self.db = db

    def revise_schema(self) -> Tuple[bool, Dict[str, str]]:
        """
        Revise protection settings schema with updated defaults and removed redundancy
        """
        modifications = {}
        
        try:
            with self.app.app_context():
                # Drop redundant column
                drop_column_sql = """
                ALTER TABLE user_protection_settings 
                DROP COLUMN max_tickets_per_raffle;
                """
                
                # Update remaining columns
                modifications_sql = [
                    """
                    ALTER TABLE user_protection_settings 
                    MODIFY daily_max_tickets INT NOT NULL DEFAULT 1000,
                    MODIFY daily_spend_limit DECIMAL(10,2) NOT NULL DEFAULT 1000.00,
                    MODIFY cool_down_minutes INT NOT NULL DEFAULT 0,
                    MODIFY updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP 
                    ON UPDATE CURRENT_TIMESTAMP
                    """
                ]
                
                with self.db.engine.begin() as conn:
                    # Drop redundant column
                    try:
                        conn.execute(text(drop_column_sql))
                        modifications['schema_update'] = "Removed redundant max_tickets_per_raffle"
                        logger.info("Removed redundant column")
                    except Exception as e:
                        logger.warning(f"Column drop failed (might not exist): {str(e)}")
                    
                    # Update remaining columns
                    for sql in modifications_sql:
                        conn.execute(text(sql))
                        modifications['defaults_update'] = "Updated default values"
                        logger.info("Updated column defaults")

                # Verify changes
                success = self._verify_changes()
                return success, modifications
                
        except Exception as e:
            logger.error(f"Schema revision failed: {str(e)}")
            return False, modifications

    def _verify_changes(self) -> bool:
        """Verify schema changes and defaults"""
        try:
            with self.db.engine.connect() as conn:
                table_def = conn.execute(text(
                    "SHOW CREATE TABLE user_protection_settings"
                )).fetchone()[1]
                
                # Verify expected defaults
                expected_values = {
                    'daily_max_tickets': '1000',
                    'daily_spend_limit': '1000.00',
                    'cool_down_minutes': '0'
                }
                
                for column, default in expected_values.items():
                    if f"DEFAULT {default}" not in table_def:
                        logger.error(f"Default verification failed for {column}")
                        return False
                
                # Verify redundant column removal
                if 'max_tickets_per_raffle' in table_def:
                    logger.error("Redundant column still exists")
                    return False
                
                return True
                
        except Exception as e:
            logger.error(f"Verification failed: {str(e)}")
            return False

def main():
    """Execute schema revision"""
    revision = ProtectionSettingsRevision()
    success, modifications = revision.revise_schema()
    
    print("\nSchema Revision Results:")
    print("=" * 50)
    for change, result in modifications.items():
        print(f"{change:25}: {result}")
    print("=" * 50)
    print(f"Overall Status: {'PASSED' if success else 'FAILED'}")
    
    sys.exit(0 if success else 1)

if __name__ == "__main__":
    main()