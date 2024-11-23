# test_db_tables.py
from app import create_app
from src.shared import db
from sqlalchemy import text

app = create_app()

with app.app_context():
    try:
        # Connect to the database
        with db.engine.connect() as connection:
            print("Database connection successful!")
            
            # Get all tables
            result = connection.execute(text("SHOW TABLES"))
            tables = result.fetchall()
            print("\nCurrent tables in database:")
            for table in tables:
                print(f"- {table[0]}")
            
            # Check if alembic_version exists
            has_alembic = connection.execute(text(
                "SHOW TABLES LIKE 'alembic_version'"
            )).fetchone() is not None
            print("\nAlembic version table exists:", has_alembic)
            
    except Exception as e:
        print(f"Database error: {e}")