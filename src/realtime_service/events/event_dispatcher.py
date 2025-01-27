# src/realtime_service/events/event_dispatcher.py

"""
Event Dispatcher Module

Implements the core event dispatching logic for the real-time messaging system.
Handles event routing, validation, and delivery while maintaining proper error handling
and logging.
"""

from typing import Dict, List, Optional, Callable, Any
from datetime import datetime, timezone
import logging
import asyncio
from .event_types import Event, EventType, EventCategory
from ..websocket.connection_manager import ConnectionManager

logger = logging.getLogger(__name__)

class EventDispatcher:
    """
    Handles event routing and delivery across the real-time system
    
    Implements comprehensive event handling with:
    - Type-safe event dispatching
    - Handler registration
    - Error recovery
    - Performance monitoring
    """
    
    def __init__(self, connection_manager: ConnectionManager):
        self.connection_manager = connection_manager
        self.handlers: Dict[EventType, List[Callable]] = {}
        self.error_handlers: List[Callable] = []
        
    async def dispatch(self, event: Event) -> None:
        """
        Dispatch event to appropriate handlers
        
        Args:
            event: Event to be dispatched
            
        Raises:
            RuntimeError: If dispatch fails critically
        """
        try:
            logger.debug(f"Dispatching event: {event.type.value}")
            
            # Execute type-specific handlers
            if event.type in self.handlers:
                for handler in self.handlers[event.type]:
                    try:
                        await handler(event)
                    except Exception as e:
                        logger.error(f"Handler error for {event.type}: {str(e)}")
                        await self._handle_error(e, event)
            
            # Handle delivery based on event target
            if event.target_user_id:
                await self._deliver_to_user(event)
            elif event.broadcast_channel:
                await self._deliver_to_channel(event)
                
        except Exception as e:
            logger.error(f"Event dispatch error: {str(e)}", exc_info=True)
            await self._handle_error(e, event)
            raise RuntimeError(f"Event dispatch failed: {str(e)}")
    
    def register_handler(self, event_type: EventType, handler: Callable) -> None:
        """Register handler for specific event type"""
        if event_type not in self.handlers:
            self.handlers[event_type] = []
        self.handlers[event_type].append(handler)
        logger.info(f"Registered handler for {event_type.value}")
    
    def register_error_handler(self, handler: Callable) -> None:
        """Register global error handler"""
        self.error_handlers.append(handler)
        
    async def _deliver_to_user(self, event: Event) -> None:
        """Deliver event to specific user"""
        if not event.target_user_id:
            return
            
        try:
            await self.connection_manager.send_to_user(
                user_id=event.target_user_id,
                message=event.to_dict()
            )
        except Exception as e:
            logger.error(f"User delivery error: {str(e)}")
            await self._handle_error(e, event)
    
    async def _deliver_to_channel(self, event: Event) -> None:
        """Deliver event to broadcast channel"""
        if not event.broadcast_channel:
            return
            
        try:
            await self.connection_manager.broadcast_message(
                message=event.to_dict(),
                channel=event.broadcast_channel
            )
        except Exception as e:
            logger.error(f"Channel delivery error: {str(e)}")
            await self._handle_error(e, event)
    
    async def _handle_error(self, error: Exception, event: Event) -> None:
        """Handle dispatch errors through registered error handlers"""
        error_event = Event(
            type=EventType.ERROR,
            category=EventCategory.SYSTEM,
            data={
                "error": str(error),
                "original_event": event.to_dict()
            },
            metadata=event.metadata
        )
        
        for handler in self.error_handlers:
            try:
                await handler(error_event)
            except Exception as e:
                logger.error(f"Error handler failed: {str(e)}")