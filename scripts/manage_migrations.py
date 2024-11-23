# scripts/manage_migrations.py

import os
import sys
from pathlib import Path
import subprocess
import logging
from datetime import datetime

# Add project root to Python path
project_root = str(Path(__file__).parent.parent)
sys.path.append(project_root)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class MigrationManager:
    def __init__(self):
        self.flask_cmd = 'flask'
    
    def _run_command(self, command, error_msg):
        """Run a command and handle errors"""
        try:
            result = subprocess.run(
                command,
                capture_output=True,
                text=True,
                check=True
            )
            logger.info(result.stdout)
            return True
        except subprocess.CalledProcessError as e:
            logger.error(f"{error_msg}: {e.stderr}")
            return False

    def check_current_state(self):
        """Check current migration state"""
        logger.info("Checking current migration state...")
        return self._run_command(
            [self.flask_cmd, 'db', 'current'],
            "Failed to get current migration state"
        )

    def check_history(self):
        """Check migration history"""
        logger.info("Checking migration history...")
        return self._run_command(
            [self.flask_cmd, 'db', 'history'],
            "Failed to get migration history"
        )

    def create_migration(self, message):
        """Create new migration"""
        logger.info(f"Creating new migration: {message}")
        return self._run_command(
            [self.flask_cmd, 'db', 'migrate', '-m', message],
            "Failed to create migration"
        )

    def upgrade_database(self):
        """Upgrade database to latest migration"""
        logger.info("Upgrading database...")
        return self._run_command(
            [self.flask_cmd, 'db', 'upgrade'],
            "Failed to upgrade database"
        )

    def downgrade_database(self):
        """Downgrade database by one version"""
        logger.info("Downgrading database...")
        return self._run_command(
            [self.flask_cmd, 'db', 'downgrade'],
            "Failed to downgrade database"
        )

    def stamp_head(self):
        """Stamp the database with the current head"""
        logger.info("Stamping database with current head...")
        return self._run_command(
            [self.flask_cmd, 'db', 'stamp', 'head'],
            "Failed to stamp database"
        )

    def manage(self):
        """Interactive migration management"""
        while True:
            print("\nMigration Management Menu:")
            print("1. Check current migration state")
            print("2. View migration history")
            print("3. Create new migration")
            print("4. Upgrade database")
            print("5. Downgrade database")
            print("6. Stamp database with current head")
            print("7. Run full migration update")
            print("0. Exit")

            choice = input("\nEnter your choice (0-7): ")

            if choice == '0':
                break
            elif choice == '1':
                self.check_current_state()
            elif choice == '2':
                self.check_history()
            elif choice == '3':
                message = input("Enter migration message: ")
                self.create_migration(message)
            elif choice == '4':
                self.upgrade_database()
            elif choice == '5':
                self.downgrade_database()
            elif choice == '6':
                self.stamp_head()
            elif choice == '7':
                logger.info("Running full migration update...")
                self.check_current_state()
                self.stamp_head()
                self.create_migration(f"Update_{datetime.now().strftime('%Y%m%d_%H%M%S')}")
                self.upgrade_database()

def main():
    manager = MigrationManager()
    manager.manage()

if __name__ == "__main__":
    logger.info("Starting Migration Manager...")
    main()