# scripts/migrate_db.py

import os
import sys
from pathlib import Path
import subprocess
import logging
import mysql.connector
from mysql.connector import Error

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

def check_mysql_connection(host, user, password):
    """Test MySQL connection"""
    try:
        connection = mysql.connector.connect(
            host=host,
            user=user,
            password=password
        )
        if connection.is_connected():
            logger.info('MySQL connection successful')
            connection.close()
            return True
    except Error as e:
        logger.error(f'Error connecting to MySQL: {e}')
        return False

def create_database_if_not_exists(host, user, password, db_name):
    """Create database if it doesn't exist"""
    try:
        connection = mysql.connector.connect(
            host=host,
            user=user,
            password=password
        )
        if connection.is_connected():
            cursor = connection.cursor()
            cursor.execute(f"CREATE DATABASE IF NOT EXISTS {db_name}")
            logger.info(f'Database {db_name} created or already exists')
    except Error as e:
        logger.error(f'Error creating database: {e}')
        sys.exit(1)
    finally:
        if connection.is_connected():
            cursor.close()
            connection.close()

def run_migrations():
    """Run all database migrations"""
    try:
        # Initialize migrations if not already done
        if not os.path.exists('migrations'):
            logger.info('Initializing migrations...')
            subprocess.run(['flask', 'db', 'init'], check=True)

        # Create migration
        logger.info('Creating migration...')
        subprocess.run([
            'flask', 'db', 'migrate',
            '-m', 'Initialize user service tables'
        ], check=True)

        # Apply migration
        logger.info('Applying migration...')
        subprocess.run(['flask', 'db', 'upgrade'], check=True)

        logger.info('Migration completed successfully')
        return True
    except subprocess.CalledProcessError as e:
        logger.error(f'Migration error: {e}')
        return False

def main():
    """Main migration function"""
    # Load environment variables for database
    DB_HOST = os.getenv('DB_HOST', 'localhost')
    DB_USER = os.getenv('DB_USER', 'root')
    DB_PASSWORD = os.getenv('DB_PASSWORD', 'WildRandom2024#Dev')
    DB_NAME = os.getenv('DB_NAME', 'wildrandom_v3_db')

    logger.info('Starting database migration process...')

    # Check MySQL connection
    if not check_mysql_connection(DB_HOST, DB_USER, DB_PASSWORD):
        logger.error('Could not connect to MySQL. Please check your credentials.')
        sys.exit(1)

    # Create database if not exists
    create_database_if_not_exists(DB_HOST, DB_USER, DB_PASSWORD, DB_NAME)

    # Run migrations
    if run_migrations():
        logger.info('Migration process completed successfully')
    else:
        logger.error('Migration process failed')
        sys.exit(1)

if __name__ == '__main__':
    main()