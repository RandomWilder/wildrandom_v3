# migrations_app.py
from flask import Flask
from src.shared import db, migrate
from src.shared.config import config
import logging

# Configure logging
logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

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
    RaffleHistory,
    TicketReservation
)

# Payment Service Models
from src.payment_service.models import (
    Transaction,
    Balance,
    TransactionLog
)

# Task Scheduler Models
from src.taskscheduler_service.models import (
    ScheduledTask,
    TaskType,
    TaskStatus
)

def create_app() -> Flask:
    """Initialize Flask application for migrations"""
    app = Flask(__name__)
    app.config.from_object(config['development'])
    
    # Initialize extensions
    db.init_app(app)
    migrate.init_app(app, db)
    
    return app

def init_db() -> None:
    """Initialize database tables with comprehensive logging"""
    app = create_app()
    
    with app.app_context():
        try:
            # Debug: Print all tables that SQLAlchemy knows about
            logger.info("Checking available database tables...")
            tables = db.metadata.tables.keys()
            logger.info(f"Found {len(tables)} tables: {sorted(tables)}")
            
            # Create all tables
            logger.info("Creating database tables...")
            db.create_all()
            logger.info("Database tables created successfully!")
            
        except Exception as e:
            logger.error(f"Database initialization failed: {str(e)}")
            raise

# Create the application instance
app = create_app()

if __name__ == '__main__':
    logger.info("Starting database initialization process...")
    init_db()