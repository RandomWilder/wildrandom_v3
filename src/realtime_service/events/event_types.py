# src/realtime_service/events/event_types.py

"""
Event Type Definitions

Defines the core event types and structures for the real-time messaging system.
Ensures type safety and consistent event handling across the platform.

Note: This module serves as the single source of truth for event definitions
and must be kept in sync with frontend event handlers.
"""

from enum import Enum
from typing import Dict, Any, Optional
from dataclasses import dataclass
from datetime import datetime, timezone

class EventCategory(str, Enum):
    """High-level event categories for routing and handling"""
    SYSTEM = "system"
    USER = "user"
    GAME = "game"
    RAFFLE = "raffle"
    PAYMENT = "payment"

class EventType(str, Enum):
    """Specific event types within categories"""
    # System events
    CONNECTION_ESTABLISHED = "connection_established"
    CONNECTION_CLOSED = "connection_closed"
    STATE_SYNC = "state_sync"
    ERROR = "error"
    
    # Raffle events
    RAFFLE_STATE_CHANGE = "raffle_state_change"
    RAFFLE_TIMER_UPDATE = "raffle_timer_update"
    TICKET_PURCHASED = "ticket_purchased"
    TICKET_REVEALED = "ticket_revealed"
    PRIZE_WON = "prize_won"
    
    # User events
    BALANCE_UPDATE = "balance_update"
    LOYALTY_UPDATE = "loyalty_update"
    
    def __str__(self) -> str:
        return self.value

@dataclass
class EventMetadata:
    """Metadata for event tracking and debugging"""
    timestamp: datetime = datetime.now(timezone.utc)
    version: str = "1.0"
    sequence_number: Optional[int] = None
    correlation_id: Optional[str] = None
    source_service: Optional[str] = None

@dataclass
class Event:
    """
    Core event structure for all real-time messages
    
    Attributes:
        type: Specific event type
        category: High-level event category
        data: Event payload
        metadata: Event tracking information
        target_user_id: Optional user-specific event target
        broadcast_channel: Optional channel for broadcast events
    """
    type: EventType
    category: EventCategory
    data: Dict[str, Any]
    metadata: EventMetadata
    target_user_id: Optional[int] = None
    broadcast_channel: Optional[str] = None

    def to_dict(self) -> Dict[str, Any]:
        """Convert event to dictionary for transmission"""
        return {
            "type": self.type.value,
            "category": self.category.value,
            "data": self.data,
            "metadata": {
                "timestamp": self.metadata.timestamp.isoformat(),
                "version": self.metadata.version,
                "sequence_number": self.metadata.sequence_number,
                "correlation_id": self.metadata.correlation_id,
                "source_service": self.metadata.source_service
            },
            "target_user_id": self.target_user_id,
            "broadcast_channel": self.broadcast_channel
        }

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'Event':
        """Create event instance from dictionary"""
        metadata = EventMetadata(
            timestamp=datetime.fromisoformat(data["metadata"]["timestamp"]),
            version=data["metadata"]["version"],
            sequence_number=data["metadata"]["sequence_number"],
            correlation_id=data["metadata"]["correlation_id"],
            source_service=data["metadata"]["source_service"]
        )
        
        return cls(
            type=EventType(data["type"]),
            category=EventCategory(data["category"]),
            data=data["data"],
            metadata=metadata,
            target_user_id=data.get("target_user_id"),
            broadcast_channel=data.get("broadcast_channel")
        )