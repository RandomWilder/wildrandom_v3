import logging
from logging.config import fileConfig

from flask import current_app

from alembic import context
import sys
import os

# Add the project root directory to Python path
sys.path.append(os.path.dirname(os.path.dirname(__file__)))

# Import your models here
from src.user_service.models import (
    User, 
    UserActivity, 
    UserStatusChange, 
    CreditTransaction
)

from src.prize_center_service.models import (
    PrizePool,
    PrizeTemplate,
    PrizeInstance
)

from src.raffle_service.models import (
    Raffle,
    Ticket,
    RaffleDraw,
    RaffleHistory
)

# this is the Alembic Config object, which provides
# access to the values within the .ini file in use.
config = context.config

# Interpret the config file for Python logging.
# This line sets up loggers basically.
fileConfig(config.config_file_name)
logger = logging.getLogger('alembic.env')

def get_engine():
    try:
        # this works with Flask-SQLAlchemy<3 and Alchemical
        return current_app.extensions['migrate'].db.get_engine()
    except (TypeError, AttributeError):
        # this works with Flask-SQLAlchemy>=3
        return current_app.extensions['migrate'].db.engine

# add your model's MetaData object here
# for 'autogenerate' support
from src.shared import db
target_metadata = db.metadata

def run_migrations_offline():
    """Run migrations in 'offline' mode."""
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()

def run_migrations_online():
    """Run migrations in 'online' mode."""
    connectable = get_engine()

    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata,
            compare_type=True
        )

        with context.begin_transaction():
            context.run_migrations()

if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()