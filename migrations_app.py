# migrations_app.py

from flask import Flask
from src.shared import db, migrate
from src.shared.config import config

# User Service Models
from src.user_service.models import (
    User, 
    UserActivity, 
    UserStatusChange, 
    CreditTransaction,
    PasswordReset
)

# Prize Center Service Models
from src.prize_center_service.models import (
    PrizePool,
    PrizeTemplate,
    PrizeInstance,
    InstantWinInstance,
    DrawWinInstance
)

# Raffle Service Models
from src.raffle_service.models import (
    Raffle,
    Ticket,
    RaffleDraw,
    RaffleHistory
)

# Create Flask app
app = Flask(__name__)
app.config.from_object(config['development'])

# Initialize extensions
db.init_app(app)
migrate.init_app(app, db)

def init_db():
    """Initialize database tables"""
    with app.app_context():
        # Debug: Print all tables that SQLAlchemy knows about
        print("Available tables:", db.metadata.tables.keys())
        # Create all tables
        db.create_all()
        print("Database tables created successfully!")

if __name__ == '__main__':
    init_db()