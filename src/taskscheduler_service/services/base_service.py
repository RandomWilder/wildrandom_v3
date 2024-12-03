from typing import Optional, Tuple, Dict, Any
from sqlalchemy.exc import SQLAlchemyError
from src.shared import db
from functools import wraps
import logging

logger = logging.getLogger(__name__)

class BaseTaskService:
    """Base service with common transaction and validation patterns"""

    @staticmethod
    def handle_transaction(func):
        """Decorator for handling database transactions"""
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
    def validate_task_params(func):
        """Decorator for validating task parameters"""
        @wraps(func)
        def wrapper(cls, task_data: Dict[str, Any], *args, **kwargs):
            try:
                # Basic validation
                required_fields = ['task_type', 'target_id', 'execution_time']
                for field in required_fields:
                    if field not in task_data:
                        return None, f"Missing required field: {field}"
                
                return func(cls, task_data, *args, **kwargs)
            except Exception as e:
                logger.error(f"Task validation error: {str(e)}")
                return None, str(e)
        return wrapper

    @staticmethod
    def log_operation(operation_name: str):
        """Decorator for logging service operations"""
        def decorator(func):
            @wraps(func)
            def wrapper(*args, **kwargs):
                logger.info(f"Starting {operation_name}")
                try:
                    result = func(*args, **kwargs)
                    logger.info(f"Completed {operation_name}")
                    return result
                except Exception as e:
                    logger.error(f"Error in {operation_name}: {str(e)}")
                    raise
            return wrapper
        return decorator
    