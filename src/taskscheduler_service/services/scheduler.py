from typing import Optional, Callable, Dict, Any
from datetime import datetime, timezone, timedelta
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.job import Job
from apscheduler.triggers.date import DateTrigger
from src.shared import db
from ..models import ScheduledTask, TaskStatus
import logging

logger = logging.getLogger(__name__)

class TaskSchedulerEngine:
    """Core scheduling engine handling task execution and management"""
    
    def __init__(self, interval_seconds: int = 60):
        self.scheduler = BackgroundScheduler(
            timezone=timezone.utc,
            job_defaults={'coalesce': True, 'max_instances': 1}
        )
        self.interval_seconds = interval_seconds
        self.task_handlers: Dict[str, Callable] = {}
        self._initialize_scheduler()

    def _initialize_scheduler(self) -> None:
        """Initialize the scheduler with core jobs"""
        self.scheduler.add_job(
            self._process_pending_tasks,
            'interval',
            seconds=self.interval_seconds,
            id='task_processor'
        )
        
        # Add maintenance jobs
        self.scheduler.add_job(
            self._cleanup_completed_tasks,
            'cron',
            hour=0,  # Run at midnight
            id='task_cleanup'
        )
        
        self.scheduler.add_job(
            self._retry_failed_tasks,
            'interval',
            minutes=5,  # Check failed tasks every 5 minutes
            id='task_retry'
        )
        
        logger.info("Scheduler initialized with all core jobs")

    def start(self) -> None:
        """Start the scheduler"""
        if not self.scheduler.running:
            self.scheduler.start()
            logger.info("Task scheduler started")

    def shutdown(self) -> None:
        """Shutdown the scheduler"""
        if self.scheduler.running:
            self.scheduler.shutdown()
            logger.info("Task scheduler shutdown")

    def register_handler(self, task_type: str, handler: Callable) -> None:
        """Register a handler for a specific task type"""
        self.task_handlers[task_type] = handler
        logger.info(f"Registered handler for task type: {task_type}")

    def _process_pending_tasks(self) -> None:
        """Process all pending tasks"""
        try:
            current_time = datetime.now(timezone.utc)
            tasks = ScheduledTask.get_pending_tasks(current_time)
            
            # Group tasks by target_id to handle concurrent executions
            grouped_tasks = {}
            for task in tasks:
                if task.target_id not in grouped_tasks:
                    grouped_tasks[task.target_id] = []
                grouped_tasks[task.target_id].append(task)
            
            # Process groups with small delays to prevent conflicts
            delay_seconds = 0
            for target_id, task_group in grouped_tasks.items():
                for task in task_group:
                    # Schedule immediate execution with progressive delays
                    execution_time = current_time + timedelta(seconds=delay_seconds)
                    self.scheduler.add_job(
                        self._execute_task,
                        args=[task],
                        trigger=DateTrigger(execution_time, timezone=timezone.utc),
                        id=f"immediate_{task.id}"
                    )
                    delay_seconds += 3  # Add 3-second delay between tasks
                
        except Exception as e:
            logger.error(f"Error processing pending tasks: {str(e)}", exc_info=True)

    def _execute_task(self, task: ScheduledTask) -> None:
        """Execute a single task"""
        try:
            if task.task_type not in self.task_handlers:
                error_msg = f"No handler registered for task type: {task.task_type}"
                task.mark_failed(error_msg)
                logger.error(error_msg)
                return

            handler = self.task_handlers[task.task_type]
            handler(task)
            task.mark_completed()
            db.session.commit()
            
        except Exception as e:
            error_msg = f"Task execution failed: {str(e)}"
            task.mark_failed(error_msg)
            logger.error(error_msg, exc_info=True)
            
            # Handle task retry if applicable
            if task.can_retry(max_retries=3):
                self._schedule_retry(task)
            
            db.session.commit()

    def _schedule_retry(self, task: ScheduledTask) -> None:
        """Schedule a retry for failed task"""
        try:
            retry_delay = 5 * (2 ** (task.retry_count))  # Exponential backoff
            retry_time = datetime.now(timezone.utc) + timedelta(minutes=retry_delay)
            
            task.reset_for_retry()
            task.execution_time = retry_time
            
            logger.info(f"Scheduled retry for task {task.id} at {retry_time}")
            
        except Exception as e:
            logger.error(f"Error scheduling retry for task {task.id}: {str(e)}")

    def schedule_task(self, task: ScheduledTask) -> Optional[str]:
        """Schedule a new task for execution"""
        try:
            # Add immediate execution job if task time is very close
            if (task.execution_time - datetime.now(timezone.utc)) <= timedelta(seconds=self.interval_seconds):
                self.scheduler.add_job(
                    self._execute_task,
                    args=[task],
                    trigger=DateTrigger(task.execution_time, timezone=timezone.utc),
                    id=f"immediate_{task.id}"
                )
            return task.id
            
        except Exception as e:
            logger.error(f"Error scheduling task: {str(e)}")
            return None

    def _cleanup_completed_tasks(self) -> None:
        """Clean up old completed tasks"""
        try:
            cutoff_date = datetime.now(timezone.utc) - timedelta(days=7)
            
            ScheduledTask.query.filter(
                ScheduledTask.status == TaskStatus.COMPLETED.value,
                ScheduledTask.updated_at < cutoff_date
            ).delete()
            
            db.session.commit()
            logger.info("Completed task cleanup")
            
        except Exception as e:
            logger.error(f"Error during task cleanup: {str(e)}")
            db.session.rollback()

    def _retry_failed_tasks(self) -> None:
        """Retry failed tasks that are eligible"""
        try:
            failed_tasks = ScheduledTask.get_failed_tasks()
            
            for task in failed_tasks:
                if task.can_retry(max_retries=3):
                    self._schedule_retry(task)
            
            db.session.commit()
            
        except Exception as e:
            logger.error(f"Error processing failed tasks: {str(e)}")
            db.session.rollback()