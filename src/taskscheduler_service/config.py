from datetime import timedelta
from typing import Dict, Any

class TaskSchedulerConfig:
    """Configuration for task scheduler service with comprehensive settings"""
    
    # Core scheduler settings
    TASK_SCHEDULER_INTERVAL = 60  # seconds
    TASK_MAX_RETRIES = 3
    TASK_RETRY_DELAY_BASE = 5  # minutes
    TASK_CLEANUP_AGE_DAYS = 7
    
    # Monitoring and alerting settings
    ALERT_ADMIN_EMAIL = "admin@example.com"
    ALERT_THRESHOLDS = {
        'failed_tasks_threshold': 5,  # Alert if more than 5 failed tasks
        'retry_threshold': 3,  # Alert after 3 retry attempts
        'execution_delay_threshold': 300  # Alert if task execution delayed by 5+ minutes
    }
    
    # Task type specific settings
    STATE_TRANSITION_SETTINGS: Dict[str, Any] = {
        'pre_transition_buffer': timedelta(minutes=5),
        'post_transition_check': timedelta(minutes=1),
        'state_validation_interval': timedelta(minutes=15),
        'alert_on_invalid_state': True
    }
    
    DRAW_EXECUTION_SETTINGS: Dict[str, Any] = {
        'execution_delay': timedelta(minutes=1),
        'completion_timeout': timedelta(minutes=5),
        'max_concurrent_draws': 3,
        'draw_batch_size': 10
    }
    
    # Future feature settings
    WINNER_NOTIFICATION_SETTINGS: Dict[str, Any] = {
        'notification_delay': timedelta(minutes=5),
        'retry_interval': timedelta(minutes=15),
        'max_notification_attempts': 3
    }
    
    # Performance optimization settings
    TASK_QUEUE_SETTINGS: Dict[str, Any] = {
        'batch_size': 100,
        'max_queue_size': 1000,
        'processing_timeout': 300,  # seconds
        'concurrent_executors': 4
    }
    
    # Database optimization settings
    DB_MAINTENANCE_SETTINGS: Dict[str, Any] = {
        'cleanup_batch_size': 500,
        'index_rebuild_interval': timedelta(days=7),
        'vacuum_threshold': 1000  # Run vacuum after 1000 deletions
    }
    
    @classmethod
    def get_task_specific_settings(cls, task_type: str) -> Dict[str, Any]:
        """Get settings for a specific task type"""
        settings_map = {
            'state_transition': cls.STATE_TRANSITION_SETTINGS,
            'draw_execution': cls.DRAW_EXECUTION_SETTINGS,
            'winner_notification': cls.WINNER_NOTIFICATION_SETTINGS
        }
        return settings_map.get(task_type, {})