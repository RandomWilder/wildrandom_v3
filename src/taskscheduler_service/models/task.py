from datetime import datetime, timezone
from typing import Dict, Optional
from uuid import uuid4
from src.shared import db
from .enums import TaskType, TaskStatus
import logging

logger = logging.getLogger(__name__)

class ScheduledTask(db.Model):
    """Base model for scheduled tasks with comprehensive tracking and error handling"""
    
    __tablename__ = 'scheduled_tasks'
    __table_args__ = (
        db.Index('idx_execution_time', 'execution_time', 'status'),
        {'extend_existing': True}
    )

    # Core fields
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid4()))
    task_type = db.Column(db.String(50), nullable=False)
    target_id = db.Column(db.Integer, nullable=False)  # Usually raffle_id
    execution_time = db.Column(db.DateTime(timezone=True), nullable=False)
    
    # Status tracking
    status = db.Column(
        db.String(20), 
        nullable=False, 
        default=TaskStatus.PENDING.value
    )
    
    # Error handling and retry tracking
    retry_count = db.Column(db.Integer, default=0)
    last_error = db.Column(db.Text, nullable=True)
    last_retry = db.Column(db.DateTime(timezone=True), nullable=True)
    
    # Task parameters and metadata
    params = db.Column(db.JSON, nullable=True)
    created_at = db.Column(
        db.DateTime(timezone=True), 
        default=lambda: datetime.now(timezone.utc)
    )
    updated_at = db.Column(
        db.DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc)
    )

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self.validate()

    def validate(self) -> None:
        """Validate task data"""
        if not TaskType.has_value(self.task_type):
            raise ValueError(f"Invalid task type: {self.task_type}")
        
        if self.execution_time <= datetime.now(timezone.utc):
            raise ValueError("Execution time must be in the future")

    def mark_completed(self) -> None:
        """Mark task as successfully completed"""
        self.status = TaskStatus.COMPLETED.value
        self.updated_at = datetime.now(timezone.utc)
        logger.info(f"Task {self.id} marked as completed")

    def mark_failed(self, error: str) -> None:
        """Mark task as failed with error details"""
        self.status = TaskStatus.FAILED.value
        self.last_error = error
        self.updated_at = datetime.now(timezone.utc)
        logger.error(f"Task {self.id} failed: {error}")

    def increment_retry(self) -> None:
        """Increment retry count and update timestamp"""
        self.retry_count += 1
        self.last_retry = datetime.now(timezone.utc)
        self.updated_at = datetime.now(timezone.utc)
        logger.info(f"Task {self.id} retry count increased to {self.retry_count}")

    def can_retry(self, max_retries: int) -> bool:
        """Check if task can be retried"""
        return self.retry_count < max_retries

    def reset_for_retry(self) -> None:
        """Reset task status for retry attempt"""
        self.status = TaskStatus.PENDING.value
        self.increment_retry()
        logger.info(f"Task {self.id} reset for retry attempt {self.retry_count}")

    def to_dict(self) -> Dict:
        """Convert task to dictionary representation"""
        return {
            'id': self.id,
            'task_type': self.task_type,
            'target_id': self.target_id,
            'execution_time': self.execution_time.isoformat(),
            'status': self.status,
            'retry_count': self.retry_count,
            'last_error': self.last_error,
            'last_retry': self.last_retry.isoformat() if self.last_retry else None,
            'params': self.params,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat()
        }

    @classmethod
    def get_pending_tasks(cls, current_time: Optional[datetime] = None) -> list:
        """Get all pending tasks due for execution"""
        if current_time is None:
            current_time = datetime.now(timezone.utc)
            
        return cls.query.filter(
            cls.status == TaskStatus.PENDING.value,
            cls.execution_time <= current_time
        ).order_by(cls.execution_time).all()

    @classmethod
    def get_failed_tasks(cls) -> list:
        """Get all failed tasks"""
        return cls.query.filter_by(
            status=TaskStatus.FAILED.value
        ).order_by(cls.last_retry.desc()).all()