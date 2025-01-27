# src/realtime_service/events/event_processor.py

"""
Event Processor Module

Provides high-level event processing with comprehensive business logic handling,
state management, and system integration. Acts as the orchestration layer between
event dispatch and channel delivery.

Key Features:
- Business logic implementation
- State transition management
- Cross-service coordination
- Performance optimization
- Error recovery
"""

from typing import Dict, Optional, Any, List, Callable, TypeVar, Generic
from datetime import datetime, timezone
import logging
import asyncio
from dataclasses import dataclass

from .event_types import Event, EventType, EventCategory, EventMetadata
from .event_dispatcher import EventDispatcher
from ..channels.channel_manager import ChannelManager, ChannelType
from ..channels.subscription_manager import SubscriptionManager

logger = logging.getLogger(__name__)

T = TypeVar('T')

@dataclass
class ProcessingResult(Generic[T]):
    """Structured result from event processing"""
    success: bool
    result: Optional[T] = None
    error: Optional[str] = None
    metadata: Dict[str, Any] = None

class EventProcessor:
    """
    Handles high-level event processing and business logic implementation
    
    Key responsibilities:
    - Event validation and enrichment
    - Business rule application
    - State coordination
    - Error recovery
    """

    def __init__(
        self,
        dispatcher: EventDispatcher,
        channel_manager: ChannelManager,
        subscription_manager: SubscriptionManager
    ):
        self.dispatcher = dispatcher
        self.channel_manager = channel_manager
        self.subscription_manager = subscription_manager
        self._register_handlers()
        
        # Performance tracking
        self.processing_times: Dict[EventType, List[float]] = {}
        
    async def process_event(self, event: Event) -> ProcessingResult:
        """
        Process event with complete business logic handling
        
        Args:
            event: Event to process
            
        Returns:
            ProcessingResult: Processing outcome with metadata
        """
        start_time = datetime.now(timezone.utc)
        
        try:
            # Validate and enrich event
            enriched_event = await self._enrich_event(event)
            if not enriched_event:
                return ProcessingResult(
                    success=False,
                    error="Event enrichment failed"
                )
            
            # Apply business rules
            processing_result = await self._apply_business_rules(enriched_event)
            if not processing_result.success:
                return processing_result
            
            # Dispatch enriched event
            await self.dispatcher.dispatch(enriched_event)
            
            # Track performance
            self._track_processing_time(
                event.type,
                (datetime.now(timezone.utc) - start_time).total_seconds()
            )
            
            return ProcessingResult(
                success=True,
                result=processing_result.result,
                metadata={
                    "processed_at": datetime.now(timezone.utc).isoformat(),
                    "processing_time": (datetime.now(timezone.utc) - start_time).total_seconds()
                }
            )
            
        except Exception as e:
            logger.error(f"Event processing error: {str(e)}", exc_info=True)
            return ProcessingResult(
                success=False,
                error=str(e)
            )

    def _register_handlers(self) -> None:
        """Register event type specific handlers"""
        # System event handlers
        self.dispatcher.register_handler(
            EventType.CONNECTION_ESTABLISHED,
            self._handle_connection_established
        )
        self.dispatcher.register_handler(
            EventType.CONNECTION_CLOSED,
            self._handle_connection_closed
        )
        
        # Raffle event handlers
        self.dispatcher.register_handler(
            EventType.RAFFLE_STATE_CHANGE,
            self._handle_raffle_state_change
        )
        self.dispatcher.register_handler(
            EventType.TICKET_REVEALED,
            self._handle_ticket_revealed
        )
        
        # Error handling
        self.dispatcher.register_error_handler(self._handle_error)

    async def _enrich_event(self, event: Event) -> Optional[Event]:
        """
        Enrich event with additional context and metadata
        
        Args:
            event: Original event
            
        Returns:
            Optional[Event]: Enriched event or None if enrichment fails
        """
        try:
            # Add processing metadata
            event.metadata.sequence_number = self._get_next_sequence()
            
            # Add channel routing for broadcast events
            if not event.target_user_id and not event.broadcast_channel:
                event.broadcast_channel = self._determine_broadcast_channel(event)
            
            return event
            
        except Exception as e:
            logger.error(f"Event enrichment failed: {str(e)}")
            return None

    async def _apply_business_rules(self, event: Event) -> ProcessingResult:
        """
        Apply business rules to event processing
        
        Args:
            event: Event to validate
            
        Returns:
            ProcessingResult: Rule application result
        """
        try:
            # Rate limiting check
            if not self._check_rate_limits(event):
                return ProcessingResult(
                    success=False,
                    error="Rate limit exceeded"
                )
            
            # State validation
            if not await self._validate_state_transition(event):
                return ProcessingResult(
                    success=False,
                    error="Invalid state transition"
                )
            
            return ProcessingResult(success=True)
            
        except Exception as e:
            logger.error(f"Business rule application failed: {str(e)}")
            return ProcessingResult(
                success=False,
                error=str(e)
            )

    def _track_processing_time(self, event_type: EventType, duration: float) -> None:
        """Track event processing duration for performance monitoring"""
        if event_type not in self.processing_times:
            self.processing_times[event_type] = []
        self.processing_times[event_type].append(duration)
        
        # Keep only last 1000 measurements
        if len(self.processing_times[event_type]) > 1000:
            self.processing_times[event_type] = self.processing_times[event_type][-1000:]

    # Event handler implementations
    async def _handle_connection_established(self, event: Event) -> None:
        """Handle new connection event"""
        user_id = event.data.get('user_id')
        if not user_id:
            return
            
        # Subscribe to default channels
        await self.subscription_manager.subscribe_user(
            user_id=user_id,
            channel_id='system-announcements'
        )

    async def _handle_connection_closed(self, event: Event) -> None:
        """Handle connection termination"""
        user_id = event.data.get('user_id')
        if not user_id:
            return
            
        # Cleanup user subscriptions
        await self.subscription_manager.cleanup_user_subscriptions(user_id)

    async def _handle_raffle_state_change(self, event: Event) -> None:
        """Handle raffle state transitions"""
        raffle_id = event.data.get('raffle_id')
        new_state = event.data.get('new_state')
        
        if not raffle_id or not new_state:
            return
            
        # Ensure raffle channel exists
        channel_id = f"raffle-{raffle_id}"
        await self.channel_manager.create_channel(
            channel_id=channel_id,
            channel_type=ChannelType.RAFFLE
        )

    async def _handle_ticket_revealed(self, event: Event) -> None:
        """Handle ticket reveal events"""
        pass  # Implement based on business requirements

    async def _handle_error(self, error_event: Event) -> None:
        """Handle error events"""
        logger.error(
            f"Error event received: {error_event.data.get('error')}",
            extra={'event_data': error_event.to_dict()}
        )

    # Utility methods
    def _get_next_sequence(self) -> int:
        """Get next event sequence number"""
        # Implement sequence generation strategy
        return 0

    def _determine_broadcast_channel(self, event: Event) -> Optional[str]:
        """Determine appropriate broadcast channel for event"""
        if event.category == EventCategory.SYSTEM:
            return 'system-announcements'
        elif event.category == EventCategory.RAFFLE:
            raffle_id = event.data.get('raffle_id')
            return f"raffle-{raffle_id}" if raffle_id else None
        return None

    def _check_rate_limits(self, event: Event) -> bool:
        """Check rate limits for event processing"""
        # Implement rate limiting strategy
        return True

    async def _validate_state_transition(self, event: Event) -> bool:
        """Validate state transitions"""
        # Implement state transition validation
        return True