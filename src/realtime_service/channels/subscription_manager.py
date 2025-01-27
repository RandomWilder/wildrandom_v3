# src/realtime_service/channels/subscription_manager.py

"""
Subscription Management Module

Handles user subscription state and channel access patterns with proper
synchronization and consistency checks. Implements efficient subscription
tracking and updates.

Design Goals:
- Efficient subscription state management
- Proper synchronization handling
- Clear access control patterns
- Performance optimization
"""

from typing import Dict, Set, Optional, List, Any, Tuple  
from datetime import datetime, timezone
import logging
import asyncio
from .channel_manager import ChannelManager, ChannelType

logger = logging.getLogger(__name__)

class SubscriptionManager:
    """
    Manages user subscription state across channels
    
    Implements:
    - Subscription state tracking
    - Access validation
    - State synchronization
    - Performance optimization
    """

    def __init__(self, channel_manager: ChannelManager):
        self.channel_manager = channel_manager
        self.user_subscriptions: Dict[int, Set[str]] = {}
        self.subscription_limits: Dict[ChannelType, int] = {
            ChannelType.PUBLIC: 50,
            ChannelType.PRIVATE: 10,
            ChannelType.RAFFLE: 20,
            ChannelType.SYSTEM: 5,
            ChannelType.ADMIN: 10
        }

    async def subscribe_user(
        self,
        user_id: int,
        channel_id: str
    ) -> Tuple[bool, Optional[str]]:
        """
        Subscribe user to channel with validation
        
        Args:
            user_id: User attempting to subscribe
            channel_id: Target channel
            
        Returns:
            Tuple[bool, Optional[str]]: Success status and error message if any
        """
        try:
            # Get channel
            channel = self.channel_manager.channels.get(channel_id)
            if not channel:
                return False, "Channel not found"

            # Initialize user subscriptions if needed
            if user_id not in self.user_subscriptions:
                self.user_subscriptions[user_id] = set()

            # Check subscription limits
            user_subs = self.user_subscriptions[user_id]
            channel_type = channel.metadata.channel_type
            type_count = sum(1 for cid in user_subs
                           if self.channel_manager.channels[cid].metadata.channel_type == channel_type)

            if type_count >= self.subscription_limits[channel_type]:
                return False, f"Subscription limit reached for {channel_type} channels"

            # Attempt subscription
            success = await self.channel_manager.subscribe(channel_id, user_id)
            if success:
                self.user_subscriptions[user_id].add(channel_id)
                return True, None
            return False, "Subscription failed"

        except Exception as e:
            logger.error(f"Subscribe error: {str(e)}")
            return False, str(e)

    async def unsubscribe_user(
        self,
        user_id: int,
        channel_id: str
    ) -> Tuple[bool, Optional[str]]:
        """Remove user subscription from channel"""
        try:
            success = await self.channel_manager.unsubscribe(channel_id, user_id)
            if success and user_id in self.user_subscriptions:
                self.user_subscriptions[user_id].discard(channel_id)
            return success, None

        except Exception as e:
            logger.error(f"Unsubscribe error: {str(e)}")
            return False, str(e)

    async def get_user_subscriptions(
        self,
        user_id: int,
        channel_type: Optional[ChannelType] = None
    ) -> List[str]:
        """
        Get user's subscribed channels
        
        Args:
            user_id: Target user
            channel_type: Optional filter by channel type
            
        Returns:
            List[str]: List of subscribed channel IDs
        """
        try:
            if user_id not in self.user_subscriptions:
                return []

            subscriptions = self.user_subscriptions[user_id]
            if not channel_type:
                return list(subscriptions)

            return [
                channel_id for channel_id in subscriptions
                if self.channel_manager.channels[channel_id].metadata.channel_type == channel_type
            ]

        except Exception as e:
            logger.error(f"Error getting subscriptions: {str(e)}")
            return []

    async def cleanup_user_subscriptions(self, user_id: int) -> None:
        """Clean up all subscriptions for user"""
        try:
            if user_id not in self.user_subscriptions:
                return

            channels = self.user_subscriptions[user_id].copy()
            for channel_id in channels:
                await self.unsubscribe_user(user_id, channel_id)

            del self.user_subscriptions[user_id]
            logger.info(f"Cleaned up subscriptions for user {user_id}")

        except Exception as e:
            logger.error(f"Cleanup error: {str(e)}")