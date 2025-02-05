# scripts/fix_protection_defaults.py

from pathlib import Path
import sys
import logging
from sqlalchemy import text
from typing import Dict, Tuple

project_root = str(Path(__file__).parent.parent)
sys.path.append(project_root)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class ProtectionDefaultsFixer:
    def __init__(self):
        from flask import Flask
        from src.shared import db
        from src.shared.config import config
        
        self.app = Flask(__name__)
        self.app.config.from_object(config['default'])
        db.init_app(self.app)
        self.db = db

    def fix_defaults(self) -> bool:
        """Fix defaults with explicit MySQL column definitions"""
        try:
            with self.app.app_context():
                with self.db.engine.begin() as conn:
                    # Single ALTER TABLE statement for atomicity
                    sql = """
                    ALTER TABLE user_protection_settings
                        MODIFY COLUMN daily_max_tickets INT NOT NULL DEFAULT 1000,
                        MODIFY COLUMN daily_spend_limit DECIMAL(10,2) NOT NULL DEFAULT 1000.00,
                        MODIFY COLUMN cool_down_minutes INT NOT NULL DEFAULT 0,
                        MODIFY COLUMN updated_at DATETIME NOT NULL 
                            DEFAULT CURRENT_TIMESTAMP 
                            ON UPDATE CURRENT_TIMESTAMP;
                    """
                    conn.execute(text(sql))
                    
                    # Verify changes
                    verify_sql = "SHOW CREATE TABLE user_protection_settings;"
                    result = conn.execute(text(verify_sql)).fetchone()[1]
                    
                    # Verification checks
                    verifications = [
                        "DEFAULT '1000'",
                        "DEFAULT '1000.00'",
                        "DEFAULT '0'",
                        "DEFAULT CURRENT_TIMESTAMP"
                    ]
                    
                    all_verified = all(v in result for v in verifications)
                    if all_verified:
                        logger.info("All defaults verified successfully")
                    else:
                        logger.error("Default verification failed")
                        
                    return all_verified

        except Exception as e:
            logger.error(f"Fix operation failed: {str(e)}")
            return False

def main():
    fixer = ProtectionDefaultsFixer()
    success = fixer.fix_defaults()
    
    if success:
        print("\n✅ Protection settings defaults updated successfully:")
        print("daily_max_tickets    -> 1000")
        print("daily_spend_limit    -> 1000.00")
        print("cool_down_minutes    -> 0")
        print("updated_at          -> CURRENT_TIMESTAMP")
    else:
        print("\n❌ Default update failed - check logs for details")
    
    sys.exit(0 if success else 1)

if __name__ == "__main__":
    main()