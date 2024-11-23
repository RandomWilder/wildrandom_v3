# migrations_app.py

from flask import Flask
from src.shared import db, migrate
from src.shared.config import config
from src.user_service.models import User, UserActivity, UserStatusChange, CreditTransaction

# Create Flask app
app = Flask(__name__)
app.config.from_object(config['development'])

# Initialize extensions
db.init_app(app)
migrate.init_app(app, db)

if __name__ == '__main__':
    with app.app_context():
        # Create all tables
        db.create_all()
        print("Database tables created successfully!")