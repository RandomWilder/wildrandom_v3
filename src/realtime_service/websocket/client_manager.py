# src/realtime_service/websocket/client_manager.py

"""
Client Management Module

Implements comprehensive client state management, session handling, and 
connection lifecycle for WebSocket clients. Ensures proper resource management
and state consistency across client connections.

Key Features:
- Client state management
- Session tracking
- Resource cleanup
- Performance optimization
- Error resilience
"""

from typing import Dict, Set, Optional, Any, List
from datetime import datetime, timezone, timedelta
import logging
import asyncio
from dataclasses import dataclass, field
import json
from websockets.exceptions import WebSocketException

from ..events.event_types import Event, EventType, EventCategory, EventMetadata
from ..channels.subscription_manager import SubscriptionManager

logger = logging.getLogger(__name__)

@dataclass
class ClientSession:
    """
    Client session state tracking
    
    Attributes:
        user_id: Authenticated user identifier
        session_id: Unique session identifier
        subscriptions: Active channel subscriptions
        connected_at: Connection timestamp
        last_activity: Last client activity timestamp
        metadata: Additional session metadata
    """
    user_id: int
    session_id: str
    subscriptions: Set[str] = field(default_factory=set)
    connected_at: datetime = field(default_factory=lambda: datetime.now(timezone.utc))
    last_activity: datetime = field(default_factory=lambda: datetime.now(timezone.utc))
    metadata: Dict[str, Any] = field(default_factory=dict)

class ClientManager:
    """
    Manages WebSocket client lifecycle and state
    
    Implements:
    - Client session management
    - State synchronization
    - Resource cleanup
    - Performance monitoring
    """

    def __init__(self, subscription_manager: SubscriptionManager):
        self.subscription_manager = subscription_manager
        self.sessions: Dict[int, ClientSession] = {}
        self.session_lookup: Dict[str, int] = {}  # session_id -> user_id mapping
        self._cleanup_task: Optional[asyncio.Task] = None
        
        # Performance tracking
        self.connection_stats: Dict[str, int] = {
            'total_connections': 0,
            'active_connections': 0,
            'peak_connections': 0
        }

    async def initialize(self) -> None:
        """Initialize client manager and start maintenance tasks"""
        self._cleanup_task = asyncio.create_task(self._cleanup_loop())
        logger.info("Client manager initialized")

    async def shutdown(self) -> None:
        """Graceful shutdown and cleanup"""
        if self._cleanup_task:
            self._cleanup_task.cancel()
            try:
                await self._cleanup_task
            except asyncio.CancelledError:
                pass
            
        # Cleanup all sessions
        for user_id in list(self.sessions.keys()):
            await self.remove_client(user_id)
            
        logger.info("Client manager shutdown complete")

    async def add_client(
        self,
        user_id: int,
        session_id: str,
        metadata: Optional[Dict[str, Any]] = None
    ) -> bool:
        """
        Register new client connection
        
        Args:
            user_id: Authenticated user identifier
            session_id: Unique session identifier
            metadata: Optional session metadata
            
        Returns:
            bool: Success status
        """
        try:
            # Create new session
            session = ClientSession(
                user_id=user_id,
                session_id=session_id,
                metadata=metadata or {}
            )
            
            # Update session mappings
            self.sessions[user_id] = session
            self.session_lookup[session_id] = user_id
            
            # Update stats
            self.connection_stats['total_connections'] += 1
            self.connection_stats['active_connections'] += 1
            self.connection_stats['peak_connections'] = max(
                self.connection_stats['peak_connections'],
                self.connection_stats['active_connections']
            )
            
            logger.info(f"Client added - User: {user_id}, Session: {session_id}")
            return True
            
        except Exception as e:
            logger.error(f"Error adding client: {str(e)}")
            return False

    async def remove_client(self, user_id: int) -> None:
        """
        Remove client and cleanup resources
        
        Args:
            user_id: User to remove
        """
        try:
            if user_id not in self.sessions:
                return
                
            session = self.sessions[user_id]
            
            # Cleanup subscriptions
            await self.subscription_manager.cleanup_user_subscriptions(user_id)
            
            # Remove session mappings
            del self.session_lookup[session.session_id]
            del self.sessions[user_id]
            
            # Update stats
            self.connection_stats['active_connections'] -= 1
            
            logger.info(f"Client removed - User: {user_id}")
            
        except Exception as e:
            logger.error(f"Error removing client: {str(e)}")

    async def update_client_activity(
        self,
        session_id: str,
        activity_type: str
    ) -> None:
        """
        Update client activity timestamp
        
        Args:
            session_id: Client session identifier
            activity_type: Type of activity
        """
        try:
            user_id = self.session_lookup.get(session_id)
            if not user_id:
                return
                
            session = self.sessions[user_id]
            session.last_activity = datetime.now(timezone.utc)
            
            # Track activity in metadata
            if 'activity_history' not in session.metadata:
                session.metadata['activity_history'] = []
            
            session.metadata['activity_history'].append({
                'type': activity_type,
                'timestamp': session.last_activity.isoformat()
            })
            
        except Exception as e:
            logger.error(f"Error updating client activity: {str(e)}")

    async def get_client_info(self, user_id: int) -> Optional[Dict[str, Any]]:
        """
        Get client session information
        
        Args:
            user_id: Target user
            
        Returns:
            Optional[Dict[str, Any]]: Session information
        """
        try:
            session = self.sessions.get(user_id)
            if not session:
                return None
                
            return {
                'user_id': session.user_id,
                'session_id': session.session_id,
                'connected_at': session.connected_at.isoformat(),
                'last_activity': session.last_activity.isoformat(),
                'subscriptions': list(session.subscriptions),
                'metadata': session.metadata
            }
            
        except Exception as e:
            logger.error(f"Error getting client info: {str(e)}")
            return None

    async def _cleanup_loop(self) -> None:
        """Periodic cleanup of inactive sessions"""
        while True:
            try:
                await asyncio.sleep(300)  # 5-minute interval
                await self._cleanup_inactive_sessions()
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Cleanup error: {str(e)}")

    async def _cleanup_inactive_sessions(self) -> None:
        """Remove inactive sessions"""
        try:
            current_time = datetime.now(timezone.utc)
            inactive_threshold = current_time - timedelta(minutes=30)
            
            inactive_users = [
                user_id for user_id, session in self.sessions.items()
                if session.last_activity < inactive_threshold
            ]
            
            for user_id in inactive_users:
                await self.remove_client(user_id)
                logger.info(f"Removed inactive client - User: {user_id}")
                
        except Exception as e:
            logger.error(f"Session cleanup error: {str(e)}")

    def get_metrics(self) -> Dict[str, Any]:
        """Get client manager metrics"""
        return {
            'connection_stats': self.connection_stats,
            'active_sessions': len(self.sessions),
            'total_subscriptions': sum(
                len(session.subscriptions)
                for session in self.sessions.values()
            )
        }