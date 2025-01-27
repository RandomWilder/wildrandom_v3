# src/realtime_service/websocket/message_processor.py

"""
WebSocket Message Processor Module

Implements comprehensive message handling for WebSocket communication with proper
validation, routing, and error handling. Serves as the bridge between raw WebSocket
messages and our typed event system.

Business Goals:
- Real-time game state synchronization
- Secure message validation
- Efficient message routing
- Performance monitoring
- Error resilience
"""

from typing import Dict, Optional, Any, Union, Tuple
from datetime import datetime, timezone
import logging
import json
import asyncio
from dataclasses import dataclass

from ..events.event_types import Event, EventType, EventCategory, EventMetadata
from ..events.event_validator import EventValidator
from ..events.event_processor import EventProcessor
from .client_manager import ClientManager

logger = logging.getLogger(__name__)

@dataclass
class MessageContext:
    """
    Context for message processing
    
    Attributes:
        session_id: Client session identifier
        user_id: Authenticated user identifier
        timestamp: Processing start time
        trace_id: Message trace identifier
    """
    session_id: str
    user_id: int
    timestamp: datetime = datetime.now(timezone.utc)
    trace_id: Optional[str] = None

class MessageProcessor:
    """
    Handles WebSocket message processing and routing
    
    Key responsibilities:
    - Message validation
    - Protocol enforcement
    - Event conversion
    - Error handling
    - Performance tracking
    """

    def __init__(
        self,
        event_processor: EventProcessor,
        event_validator: EventValidator,
        client_manager: ClientManager
    ):
        self.event_processor = event_processor
        self.event_validator = event_validator
        self.client_manager = client_manager
        
        # Performance tracking
        self.processing_stats: Dict[str, int] = {
            'messages_received': 0,
            'messages_processed': 0,
            'validation_failures': 0,
            'processing_errors': 0
        }

    async def process_message(
        self,
        message: Union[str, bytes],
        session_id: str,
        user_id: int
    ) -> Tuple[bool, Optional[Dict[str, Any]]]:
        """
        Process incoming WebSocket message
        
        Args:
            message: Raw message content
            session_id: Client session identifier
            user_id: Authenticated user identifier
            
        Returns:
            Tuple[bool, Optional[Dict[str, Any]]]: Success status and response data
        """
        context = MessageContext(
            session_id=session_id,
            user_id=user_id
        )
        
        self.processing_stats['messages_received'] += 1
        
        try:
            # Parse and validate message
            parsed_message = await self._parse_message(message)
            if not parsed_message:
                return False, {
                    'error': 'Invalid message format',
                    'code': 'MESSAGE_PARSE_ERROR'
                }
            
            # Create and validate event
            event = await self._create_event(parsed_message, context)
            if not event:
                return False, {
                    'error': 'Invalid event format',
                    'code': 'EVENT_CREATE_ERROR'
                }
            
            # Process event
            result = await self.event_processor.process_event(event)
            if not result.success:
                self.processing_stats['processing_errors'] += 1
                return False, {
                    'error': result.error,
                    'code': 'EVENT_PROCESSING_ERROR'
                }
            
            # Update client activity
            await self.client_manager.update_client_activity(
                session_id=session_id,
                activity_type='message_processed'
            )
            
            self.processing_stats['messages_processed'] += 1
            
            return True, result.metadata
            
        except Exception as e:
            logger.error(f"Message processing error: {str(e)}", exc_info=True)
            return False, {
                'error': 'Internal processing error',
                'code': 'INTERNAL_ERROR'
            }

    async def _parse_message(
        self,
        message: Union[str, bytes]
    ) -> Optional[Dict[str, Any]]:
        """
        Parse and validate raw message
        
        Args:
            message: Raw message content
            
        Returns:
            Optional[Dict[str, Any]]: Parsed message or None if invalid
        """
        try:
            if isinstance(message, bytes):
                message = message.decode('utf-8')
                
            data = json.loads(message)
            
            # Basic structure validation
            required_fields = {'type', 'data'}
            if not all(field in data for field in required_fields):
                logger.warning("Message missing required fields")
                return None
                
            return data
            
        except json.JSONDecodeError as e:
            logger.error(f"Message parse error: {str(e)}")
            return None
        except Exception as e:
            logger.error(f"Message processing error: {str(e)}")
            return None

    async def _create_event(
        self,
        message: Dict[str, Any],
        context: MessageContext
    ) -> Optional[Event]:
        """
        Create event from parsed message
        
        Args:
            message: Parsed message data
            context: Processing context
            
        Returns:
            Optional[Event]: Created event or None if invalid
        """
        try:
            # Validate message type
            try:
                event_type = EventType(message['type'])
            except ValueError:
                logger.error(f"Invalid event type: {message['type']}")
                return None

            # Create event metadata
            metadata = EventMetadata(
                sequence_number=None,  # Will be assigned by event processor
                correlation_id=context.trace_id,
                source_service='websocket'
            )

            # Create event
            event = Event(
                type=event_type,
                category=self._determine_category(event_type),
                data=message['data'],
                metadata=metadata,
                target_user_id=context.user_id
            )

            # Validate event
            validation_result = self.event_validator.validate_event(event)
            if not validation_result.valid:
                self.processing_stats['validation_failures'] += 1
                logger.error(f"Event validation failed: {validation_result.errors}")
                return None

            return event

        except Exception as e:
            logger.error(f"Event creation error: {str(e)}")
            return None

    def _determine_category(self, event_type: EventType) -> EventCategory:
        """
        Determine event category based on type
        
        Args:
            event_type: Event type to categorize
            
        Returns:
            EventCategory: Determined category
        """
        # Map event types to categories
        category_mapping = {
            EventType.CONNECTION_ESTABLISHED: EventCategory.SYSTEM,
            EventType.CONNECTION_CLOSED: EventCategory.SYSTEM,
            EventType.STATE_SYNC: EventCategory.SYSTEM,
            EventType.RAFFLE_STATE_CHANGE: EventCategory.RAFFLE,
            EventType.TICKET_PURCHASED: EventCategory.RAFFLE,
            EventType.TICKET_REVEALED: EventCategory.RAFFLE,
            EventType.PRIZE_WON: EventCategory.RAFFLE,
            EventType.BALANCE_UPDATE: EventCategory.USER,
            EventType.LOYALTY_UPDATE: EventCategory.USER
        }
        
        return category_mapping.get(event_type, EventCategory.SYSTEM)

    def get_metrics(self) -> Dict[str, Any]:
        """Get message processor metrics"""
        return {
            'stats': self.processing_stats,
            'success_rate': self._calculate_success_rate(),
            'timestamp': datetime.now(timezone.utc).isoformat()
        }

    def _calculate_success_rate(self) -> float:
        """Calculate message processing success rate"""
        if self.processing_stats['messages_received'] == 0:
            return 100.0
            
        success_count = (
            self.processing_stats['messages_processed'] -
            self.processing_stats['processing_errors']
        )
        
        return (success_count / self.processing_stats['messages_received']) * 100