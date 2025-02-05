# scripts/fix_protection_settings_defaults.py

from pathlib import Path
import sys
import logging
from sqlalchemy import text
from typing import Dict, Tuple

# Add project root to path
project_root = str(Path(__file__).parent.parent)
sys.path.append(project_root)

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class ProtectionSettingsDefaultsFixer:
    """Fixes default values for user_protection_settings table"""
    
    def __init__(self):
        from flask import Flask
        from src.shared import db
        from src.shared.config import config
        
        self.app = Flask(__name__)
        self.app.config.from_object(config['default'])
        db.init_app(self.app)
        self.db = db
        
    def fix_defaults(self) -> Tuple[bool, Dict[str, str]]:
        """
        Fix default values for all columns
        
        Returns:
            Tuple[bool, Dict[str, str]]: Success status and modifications made
        """
        modifications = {}
        
        try:
            with self.app.app_context():
                # Define column defaults
                default_values = {
                    'daily_max_tickets': '50',
                    'max_tickets_per_raffle': '10',
                    'daily_spend_limit': '100.00',
                    'cool_down_minutes': '0',
                    'updated_at': 'CURRENT_TIMESTAMP'
                }
                
                # Modify each column
                for column, default in default_values.items():
                    modify_sql = f"""
                    ALTER TABLE user_protection_settings 
                    MODIFY COLUMN {column} {self._get_column_type(column)} 
                    DEFAULT {default}
                    """
                    
                    try:
                        with self.db.engine.begin() as conn:
                            conn.execute(text(modify_sql))
                            modifications[column] = f"Default set to {default}"
                            logger.info(f"Fixed default for {column}")
                    except Exception as e:
                        logger.error(f"Failed to fix {column}: {str(e)}")
                        return False, modifications
                
                # Verify modifications
                success = self._verify_defaults(default_values)
                return success, modifications
                
        except Exception as e:
            logger.error(f"Fix operation failed: {str(e)}")
            return False, modifications

    def _get_column_type(self, column: str) -> str:
        """Get correct column type for ALTER TABLE statement"""
        types = {
            'daily_max_tickets': 'INT NOT NULL',
            'max_tickets_per_raffle': 'INT NOT NULL',
            'daily_spend_limit': 'DECIMAL(10,2) NOT NULL',
            'cool_down_minutes': 'INT NOT NULL',
            'updated_at': 'DATETIME NOT NULL'
        }
        return types.get(column, 'INT NOT NULL')

    def _verify_defaults(self, expected_defaults: Dict[str, str]) -> bool:
        """Verify default values are set correctly"""
        try:
            with self.db.engine.connect() as conn:
                table_def = conn.execute(text(
                    "SHOW CREATE TABLE user_protection_settings"
                )).fetchone()[1]
                
                for column, default in expected_defaults.items():
                    if column != 'updated_at':  # Skip timestamp check
                        if f"DEFAULT {default}" not in table_def:
                            logger.error(f"Default verification failed for {column}")
                            return False
                            
                return True
                
        except Exception as e:
            logger.error(f"Default verification failed: {str(e)}")
            return False

def main():
    """Execute defaults fix operation"""
    fixer = ProtectionSettingsDefaultsFixer()
    success, modifications = fixer.fix_defaults()
    
    print("\nDefault Values Fix Results:")
    print("=" * 50)
    for column, result in modifications.items():
        print(f"{column:25}: {result}")
    print("=" * 50)
    print(f"Overall Status: {'PASSED' if success else 'FAILED'}")
    
    # Exit with appropriate code
    sys.exit(0 if success else 1)

if __name__ == "__main__":
    main()