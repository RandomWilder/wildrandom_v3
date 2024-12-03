from typing import Optional, Tuple, List, Dict, Any
from datetime import datetime, timezone
from sqlalchemy.exc import SQLAlchemyError
from src.shared import db
from ..models import ScheduledTask, TaskType, TaskStatus
from .base_service import BaseTaskService
from .scheduler import TaskSchedulerEngine
import logging

logger = logging.getLogger(__name__)

class TaskService(BaseTaskService):
    """Service for managing scheduled tasks"""
    
    def __init__(self, scheduler_engine: TaskSchedulerEngine):
        self.scheduler = scheduler_engine

    @BaseTaskService.handle_transaction
    @BaseTaskService.validate_task_params
    def create_task(self, task_data: Dict[str, Any]) -> Tuple[Optional[ScheduledTask], Optional[str]]:
        """Create and schedule a new task"""
        try:
            task = ScheduledTask(**task_data)
            db.session.add(task)
            db.session.flush()
            
            # Schedule task
            task_id = self.scheduler.schedule_task(task)
            if not task_id:
                raise ValueError("Failed to schedule task")
            
            return task, None
            
        except Exception as e:
            logger.error(f"Error creating task: {str(e)}")
            return None, str(e)

    @BaseTaskService.handle_transaction
    def cancel_task(self, task_id: str) -> Tuple[Optional[ScheduledTask], Optional[str]]:
        """Cancel a scheduled task"""
        try:
            task = ScheduledTask.query.get(task_id)
            if not task:
                return None, "Task not found"
                
            if task.status not in [TaskStatus.PENDING.value, TaskStatus.FAILED.value]:
                return None, f"Cannot cancel task in {task.status} status"
                
            task.status = TaskStatus.CANCELLED.value
            task.updated_at = datetime.now(timezone.utc)
            
            return task, None
            
        except Exception as e:
            logger.error(f"Error cancelling task: {str(e)}")
            return None, str(e)

    @BaseTaskService.handle_transaction
    def reschedule_task(
        self, 
        task_id: str, 
        new_execution_time: datetime
    ) -> Tuple[Optional[ScheduledTask], Optional[str]]:
        """Reschedule a task to a new execution time"""
        try:
            task = ScheduledTask.query.get(task_id)
            if not task:
                return None, "Task not found"
                
            if task.status != TaskStatus.PENDING.value:
                return None, f"Cannot reschedule task in {task.status} status"
                
            if new_execution_time <= datetime.now(timezone.utc):
                return None, "New execution time must be in the future"
                
            task.execution_time = new_execution_time
            task.updated_at = datetime.now(timezone.utc)
            
            # Re-schedule task
            task_id = self.scheduler.schedule_task(task)
            if not task_id:
                raise ValueError("Failed to reschedule task")
            
            return task, None
            
        except Exception as e:
            logger.error(f"Error rescheduling task: {str(e)}")
            return None, str(e)

    def get_tasks_by_target(
        self, 
        target_id: int, 
        task_type: Optional[str] = None,
        status: Optional[str] = None
    ) -> Tuple[Optional[List[ScheduledTask]], Optional[str]]:
        """Get tasks for a specific target"""
        try:
            query = ScheduledTask.query.filter_by(target_id=target_id)
            
            if task_type:
                query = query.filter_by(task_type=task_type)
            if status:
                query = query.filter_by(status=status)
                
            tasks = query.order_by(ScheduledTask.execution_time).all()
            return tasks, None
            
        except Exception as e:
            logger.error(f"Error getting tasks: {str(e)}")
            return None, str(e)

    def get_pending_tasks_for_target(
        self, 
        target_id: int
    ) -> Tuple[Optional[List[ScheduledTask]], Optional[str]]:
        """Get pending tasks for a specific target"""
        return self.get_tasks_by_target(
            target_id=target_id,
            status=TaskStatus.PENDING.value
        )

    @BaseTaskService.log_operation("task monitoring check")
    def check_task_health(self) -> Dict[str, Any]:
        """Check overall task health and statistics"""
        try:
            stats = {
                'total_tasks': ScheduledTask.query.count(),
                'pending_tasks': ScheduledTask.query.filter_by(
                    status=TaskStatus.PENDING.value
                ).count(),
                'failed_tasks': ScheduledTask.query.filter_by(
                    status=TaskStatus.FAILED.value
                ).count(),
                'completed_tasks': ScheduledTask.query.filter_by(
                    status=TaskStatus.COMPLETED.value
                ).count(),
                'tasks_by_type': {}
            }
            
            # Get counts by task type
            for task_type in TaskType:
                count = ScheduledTask.query.filter_by(
                    task_type=task_type.value
                ).count()
                stats['tasks_by_type'][task_type.value] = count
            
            return stats
            
        except Exception as e:
            logger.error(f"Error checking task health: {str(e)}")
            return {}