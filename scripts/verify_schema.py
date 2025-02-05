# scripts/verify_schema.py

"""
Schema Verification Tool
Provides type-safe schema validation with architectural alignment.
"""

from pathlib import Path
import sys
import logging
from sqlalchemy import inspect, text
from typing import Dict, List, Optional

project_root = str(Path(__file__).parent.parent)
sys.path.append(project_root)

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class SchemaVerifier:
    def __init__(self):
        from flask import Flask
        from src.shared import db
        from src.shared.config import config
        
        self.app = Flask(__name__)
        self.app.config.from_object(config['default'])
        db.init_app(self.app)
        self.db = db

    def verify_protection_settings(self) -> Dict[str, bool]:
        """
        Verify user_protection_settings table structure against architectural requirements
        """
        results = {
            'table_exists': False,
            'columns_valid': False,
            'foreign_key_valid': False,
            'indices_valid': False,
            'defaults_valid': False
        }

        try:
            with self.app.app_context():
                inspector = inspect(self.db.engine)
                
                # 1. Table Existence
                results['table_exists'] = 'user_protection_settings' in inspector.get_table_names()
                if not results['table_exists']:
                    return results

                # 2. Column Validation
                columns = {c['name']: c for c in inspector.get_columns('user_protection_settings')}
                required_columns = {
                    'user_id': {'nullable': False},
                    'daily_max_tickets': {'nullable': False},
                    'daily_spend_limit': {'nullable': False},
                    'cool_down_minutes': {'nullable': False},
                    'last_purchase_time': {'nullable': True},
                    'require_2fa_above': {'nullable': True},
                    'updated_at': {'nullable': False}
                }

                results['columns_valid'] = all(
                    name in columns and 
                    columns[name]['nullable'] == specs['nullable']
                    for name, specs in required_columns.items()
                )

                # 3. Foreign Key Validation
                fkeys = inspector.get_foreign_keys('user_protection_settings')
                results['foreign_key_valid'] = any(
                    fk['referred_table'] == 'users' and 
                    fk['referred_columns'] == ['id']
                    for fk in fkeys
                )

                # 4. Index Validation
                indices = inspector.get_indexes('user_protection_settings')
                results['indices_valid'] = any(
                    idx['column_names'] == ['user_id']
                    for idx in indices
                )

                # 5. Defaults Validation - Using raw SQL for precision
                with self.db.engine.connect() as conn:
                    create_stmt = conn.execute(text(
                        "SHOW CREATE TABLE user_protection_settings"
                    )).fetchone()[1].lower()

                    default_checks = [
                        "default '1000'",
                        "default '1000.00'",
                        "default '0'",
                        "default current_timestamp"
                    ]
                    
                    results['defaults_valid'] = all(
                        check in create_stmt
                        for check in default_checks
                    )

                return results

        except Exception as e:
            logger.error(f"Verification failed: {str(e)}")
            return results

def main():
    """Execute schema verification with detailed reporting"""
    verifier = SchemaVerifier()
    results = verifier.verify_protection_settings()
    
    print("\nVerification Results:")
    print("=" * 50)
    
    for check, passed in results.items():
        status = '✓' if passed else '✗'
        print(f"{check:20}: {status}")
        
    print("=" * 50)
    all_passed = all(results.values())
    print(f"Overall Status: {'PASSED' if all_passed else 'FAILED'}")
    
    if not all_passed:
        print("\nArchitectural Requirements:")
        print("1. Table must exist with correct name")
        print("2. All required columns present with correct nullability")
        print("3. Foreign key to users table properly configured")
        print("4. Index on user_id present")
        print("5. Default values correctly set:")
        print("   - daily_max_tickets: 1000")
        print("   - daily_spend_limit: 1000.00")
        print("   - cool_down_minutes: 0")
        print("   - updated_at: CURRENT_TIMESTAMP")
    
    sys.exit(0 if all_passed else 1)

if __name__ == "__main__":
    main()