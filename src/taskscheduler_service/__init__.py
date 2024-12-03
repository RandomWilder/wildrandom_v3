"""
TaskScheduler Service
Handles scheduling and management of system-wide tasks with comprehensive initialization
and handler registration.
"""

from flask import Flask
from src.shared import db, migrate
from src.shared.config import config
from typing import Optional
import logging
from datetime import datetime, timezone

logger = logging.getLogger(__name__)

# Global service instances
scheduler_engine = None
task_service = None

def init_task_scheduler(app: Flask) -> None:
    """
    Initialize TaskScheduler service components with proper error handling.
    
    Args:
        app: Flask application instance
        
    Raises:
        RuntimeError: If initialization fails
    """
    global scheduler_engine, task_service
    
    try:
        from .services.scheduler import TaskSchedulerEngine
        from .services.task_service import TaskService
        
        # Initialize scheduler engine with app configuration
        scheduler_engine = TaskSchedulerEngine(
            interval_seconds=app.config.get('TASK_SCHEDULER_INTERVAL', 60)
        )
        
        # Initialize task service
        task_service = TaskService(scheduler_engine)
        
        # Register handlers in try-except blocks
        _register_task_handlers(scheduler_engine)
        
        # Start scheduler
        scheduler_engine.start()
        
        logger.info(
            f"TaskScheduler service initialized successfully at {datetime.now(timezone.utc)}"
        )
        
    except Exception as e:
        logger.error(f"Failed to initialize TaskScheduler service: {str(e)}")
        raise RuntimeError(f"TaskScheduler initialization failed: {str(e)}")

def _register_task_handlers(scheduler) -> None:
    """Register handlers for different task types"""
    try:
        from src.raffle_service.services.state_service import StateService
        from src.raffle_service.services.draw_service import DrawService
        
        # Register state transition handler
        scheduler.register_handler(
            'state_transition',
            StateService.handle_state_transition
        )
        logger.info("Registered state transition handler")
        
        # Register draw execution handler
        scheduler.register_handler(
            'draw_execution',
            DrawService.execute_raffle_draws
        )
        logger.info("Registered draw execution handler")
        
    except Exception as e:
        logger.warning(
            f"Handler registration incomplete: {str(e)}. "
            "This is expected during initial setup."
        )
        
    except Exception as e:
        logger.error(f"Failed to register task handlers: {str(e)}")
        raise ValueError(f"Handler registration failed: {str(e)}")

# Export service instances and models
from .models import ScheduledTask, TaskType, TaskStatus

__all__ = [
    'ScheduledTask',
    'TaskType',
    'TaskStatus',
    'scheduler_engine',
    'task_service',
    'init_task_scheduler'
]