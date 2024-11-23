# test_db.py
from app import create_app
from src.shared import db
from src.user_service.models import User

app = create_app()

with app.app_context():
    try:
        db.engine.connect()
        print("Database connection successful!")
        print("Checking registered models...")
        print(f"User table name: {User.__table__.name}")
        print(f"All registered tables: {db.metadata.tables.keys()}")
    except Exception as e:
        print(f"Database connection failed: {e}")