# src/payment_service/services/base_service.py

from typing import Optional, Tuple, Dict
from sqlalchemy.exc import SQLAlchemyError
from src.shared import db
from functools import wraps
import logging

logger = logging.getLogger(__name__)

class BasePaymentService:
    """Base service with common transaction and validation patterns"""

    @staticmethod
    def handle_transaction(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            try:
                result = func(*args, **kwargs)
                db.session.commit()
                return result
            except SQLAlchemyError as e:
                db.session.rollback()
                logger.error(f"Transaction error: {str(e)}")
                return None, str(e)
        return wrapper

    @staticmethod
    def validate_user_access(func):
        @wraps(func)
        def wrapper(cls, user_id: int, *args, **kwargs):
            if not user_id:
                return None, "User ID required"
            return func(cls, user_id, *args, **kwargs)
        return wrapper