# src/realtime_service/channels/channel_manager.py

"""
Channel Management Module

Implements comprehensive channel management for the real-time messaging system.
Handles channel lifecycle, access control, and message routing with proper 
state management and performance optimization.

Key Features:
- Channel lifecycle management
- Access control and validation
- Message routing optimization
- State consistency maintenance
"""

from typing import Dict, Set, Optional, List, Any
from datetime import datetime, timezone
import logging
import asyncio
from dataclasses import dataclass, field
from enum import Enum

logger = logging.getLogger(__name__)

class ChannelType(str, Enum):
    """Channel type definitions for access control"""
    PUBLIC = "public"      # Open to all authenticated users
    PRIVATE = "private"    # Limited to specific users
    RAFFLE = "raffle"      # Raffle-specific updates
    SYSTEM = "system"      # System-wide notifications
    ADMIN = "admin"        # Administrative channels

    def __str__(self) -> str:
        return self.value

@dataclass
class ChannelMetadata:
    """Channel configuration and state tracking"""
    channel_type: ChannelType
    created_at: datetime = field(default_factory=lambda: datetime.now(timezone.utc))
    max_subscribers: int = 10000
    requires_auth: bool = True
    owner_id: Optional[int] = None
    custom_attributes: Dict[str, Any] = field(default_factory=dict)

@dataclass
class Channel:
    """
    Channel instance with subscriber management
    
    Attributes:
        id: Unique channel identifier
        metadata: Channel configuration
        subscribers: Set of subscribed user IDs
        active: Channel status flag
    """
    id: str
    metadata: ChannelMetadata
    subscribers: Set[int] = field(default_factory=set)
    active: bool = True

    def can_subscribe(self, user_id: int) -> bool:
        """Check if user can subscribe to channel"""
        if not self.active:
            return False
        if len(self.subscribers) >= self.metadata.max_subscribers:
            return False
        if self.metadata.channel_type == ChannelType.ADMIN and not self._is_admin(user_id):
            return False
        return True

    def _is_admin(self, user_id: int) -> bool:
        """Verify admin status (integrate with user service)"""
        # TODO: Implement proper admin check with user service
        return False

class ChannelManager:
    """
    Manages channel lifecycle and subscription state
    
    Implements:
    - Channel creation and cleanup
    - Subscription management
    - Access control validation
    - State consistency checks
    """

    def __init__(self):
        self.channels: Dict[str, Channel] = {}
        self._cleanup_task: Optional[asyncio.Task] = None

    async def initialize(self) -> None:
        """Initialize channel manager and start cleanup task"""
        self._cleanup_task = asyncio.create_task(self._cleanup_loop())
        logger.info("Channel manager initialized")

    async def shutdown(self) -> None:
        """Graceful shutdown of channel manager"""
        if self._cleanup_task:
            self._cleanup_task.cancel()
            try:
                await self._cleanup_task
            except asyncio.CancelledError:
                pass
        logger.info("Channel manager shut down")

    async def create_channel(
        self,
        channel_id: str,
        channel_type: ChannelType,
        owner_id: Optional[int] = None,
        **kwargs: Any
    ) -> Optional[Channel]:
        """
        Create new channel with specified configuration
        
        Args:
            channel_id: Unique channel identifier
            channel_type: Type of channel to create
            owner_id: Optional channel owner
            **kwargs: Additional channel configuration
            
        Returns:
            Optional[Channel]: Created channel or None if creation fails
        """
        try:
            if channel_id in self.channels:
                logger.error(f"Channel {channel_id} already exists")
                return None

            metadata = ChannelMetadata(
                channel_type=channel_type,
                owner_id=owner_id,
                **kwargs
            )
            
            channel = Channel(id=channel_id, metadata=metadata)
            self.channels[channel_id] = channel
            
            logger.info(f"Created channel: {channel_id} ({channel_type})")
            return channel

        except Exception as e:
            logger.error(f"Channel creation failed: {str(e)}")
            return None

    async def subscribe(self, channel_id: str, user_id: int) -> bool:
        """Subscribe user to channel with validation"""
        try:
            channel = self.channels.get(channel_id)
            if not channel:
                logger.error(f"Channel {channel_id} not found")
                return False

            if not channel.can_subscribe(user_id):
                logger.warning(f"User {user_id} cannot subscribe to {channel_id}")
                return False

            channel.subscribers.add(user_id)
            logger.info(f"User {user_id} subscribed to {channel_id}")
            return True

        except Exception as e:
            logger.error(f"Subscription error: {str(e)}")
            return False

    async def unsubscribe(self, channel_id: str, user_id: int) -> bool:
        """Remove user from channel subscribers"""
        try:
            channel = self.channels.get(channel_id)
            if not channel:
                return False

            channel.subscribers.discard(user_id)
            logger.info(f"User {user_id} unsubscribed from {channel_id}")
            return True

        except Exception as e:
            logger.error(f"Unsubscribe error: {str(e)}")
            return False

    async def get_user_channels(self, user_id: int) -> List[str]:
        """Get all channels user is subscribed to"""
        return [
            channel_id for channel_id, channel in self.channels.items()
            if user_id in channel.subscribers
        ]

    async def _cleanup_loop(self) -> None:
        """Periodic cleanup of inactive channels"""
        while True:
            try:
                await asyncio.sleep(3600)  # Hourly cleanup
                await self._cleanup_inactive_channels()
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Cleanup error: {str(e)}")

    async def _cleanup_inactive_channels(self) -> None:
        """Remove inactive and empty channels"""
        to_remove = [
            channel_id for channel_id, channel in self.channels.items()
            if not channel.active and not channel.subscribers
        ]
        
        for channel_id in to_remove:
            del self.channels[channel_id]
            logger.info(f"Cleaned up inactive channel: {channel_id}")