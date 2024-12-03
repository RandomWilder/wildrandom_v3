from enum import Enum
from typing import List

class TaskType(str, Enum):
    """Task types with string value support"""
    STATE_TRANSITION = 'state_transition'
    DRAW_EXECUTION = 'draw_execution'
    WINNER_NOTIFICATION = 'winner_notification'  # Future feature
    
    @classmethod
    def has_value(cls, value: str) -> bool:
        """Check if value is valid task type"""
        return value in [item.value for item in cls]
    
    @classmethod
    def list_values(cls) -> List[str]:
        """Get list of all valid values"""
        return [item.value for item in cls]

class TaskStatus(str, Enum):
    """Task execution status states"""
    PENDING = 'pending'
    COMPLETED = 'completed'
    FAILED = 'failed'
    CANCELLED = 'cancelled'
    
    def __str__(self) -> str:
        return self.value