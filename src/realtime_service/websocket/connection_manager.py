# src/realtime_service/websocket/connection_manager.py

"""
WebSocket Connection Manager

Implements WebSocket connection lifecycle management with proper resource handling
and type safety. Provides foundational WebSocket infrastructure for real-time
communication across the platform.

Architectural Considerations:
- Connection State Management: Thread-safe connection tracking
- Resource Lifecycle: Proper cleanup and connection termination
- Error Resilience: Comprehensive error handling and recovery
- Type Safety: Full type hinting for runtime safety
"""

from typing import Dict, Set, Optional, Any
from datetime import datetime, timezone
import logging
from dataclasses import dataclass, field
import json
import asyncio
from websockets.legacy.server import WebSocketServerProtocol
from websockets.exceptions import ConnectionClosed, ConnectionClosedError

logger = logging.getLogger(__name__)

@dataclass
class ClientConnection:
    """Tracks individual client connection state and metadata"""
    socket: WebSocketServerProtocol
    user_id: int
    connected_at: datetime = field(default_factory=lambda: datetime.now(timezone.utc))
    channels: Set[str] = field(default_factory=set)
    is_authenticated: bool = False
    last_heartbeat: datetime = field(default_factory=lambda: datetime.now(timezone.utc))

    def to_dict(self) -> Dict[str, Any]:
        """Convert connection state to dictionary representation"""
        return {
            'user_id': self.user_id,
            'connected_at': self.connected_at.isoformat(),
            'channels': list(self.channels),
            'is_authenticated': self.is_authenticated,
            'last_heartbeat': self.last_heartbeat.isoformat()
        }

class ConnectionManager:
    """
    Manages WebSocket connections and lifecycle events
    
    Implements comprehensive connection management including:
    - Connection state tracking
    - Authentication handling
    - Channel subscription management
    - Automatic cleanup of stale connections
    """
    
    def __init__(self):
        self.connections: Dict[int, ClientConnection] = {}
        self.pending_auth: Set[WebSocketServerProtocol] = set()
        self._cleanup_task: Optional[asyncio.Task] = None

    async def initialize(self) -> None:
        """Initialize connection manager and start cleanup task"""
        if self._cleanup_task:
            self._cleanup_task.cancel()
            try:
                await self._cleanup_task
            except asyncio.CancelledError:
                pass
        self._cleanup_task = asyncio.create_task(self._cleanup_loop())
        logger.info("Connection manager initialized")

    async def shutdown(self) -> None:
        """Graceful shutdown with connection cleanup"""
        if self._cleanup_task:
            self._cleanup_task.cancel()
            try:
                await self._cleanup_task
            except asyncio.CancelledError:
                pass

        close_tasks = []
        for user_id in list(self.connections.keys()):
            close_tasks.append(self.remove_connection(user_id))
        if close_tasks:
            await asyncio.gather(*close_tasks, return_exceptions=True)

    async def handle_connection(
        self, 
        websocket: WebSocketServerProtocol,
        token: str
    ) -> Optional[int]:
        """Handle new WebSocket connection with authentication"""
        try:
            self.pending_auth.add(websocket)
            user_id = await self._authenticate_connection(token)
            
            if not user_id:
                await websocket.close(1008, "Authentication failed")
                return None

            connection = ClientConnection(
                socket=websocket,
                user_id=user_id,
                is_authenticated=True
            )
            
            self.connections[user_id] = connection
            self.pending_auth.remove(websocket)
            
            logger.info(f"Client connected - User ID: {user_id}")
            return user_id

        except Exception as e:
            logger.error(f"Error handling connection: {str(e)}")
            if websocket in self.pending_auth:
                self.pending_auth.remove(websocket)
            await websocket.close(1011, "Internal server error")
            return None

    async def remove_connection(self, user_id: int) -> None:
        """Remove client connection and cleanup resources"""
        if user_id in self.connections:
            connection = self.connections[user_id]
            try:
                await connection.socket.close()
            except Exception:
                pass
            del self.connections[user_id]
            logger.info(f"Client disconnected - User ID: {user_id}")

    async def broadcast_message(
        self,
        message: Dict[str, Any],
        channel: Optional[str] = None,
        exclude_user: Optional[int] = None
    ) -> None:
        """Broadcast message to connected clients"""
        try:
            message_data = json.dumps(message)
            
            for user_id, connection in list(self.connections.items()):
                if user_id == exclude_user:
                    continue
                    
                if channel and channel not in connection.channels:
                    continue
                    
                try:
                    await connection.socket.send(message_data)
                except ConnectionClosed:
                    await self.remove_connection(user_id)
                except Exception as e:
                    logger.error(f"Error sending to user {user_id}: {str(e)}")

        except Exception as e:
            logger.error(f"Error broadcasting message: {str(e)}")

    async def _authenticate_connection(self, token: str) -> Optional[int]:
        """Authenticate WebSocket connection"""
        try:
            # TODO: Implement proper token validation
            if not token or len(token) < 10:
                return None
            return 123  # Placeholder
        except Exception as e:
            logger.error(f"Authentication error: {str(e)}")
            return None

    async def _cleanup_loop(self) -> None:
        """Execute periodic cleanup of stale connections"""
        try:
            while True:
                await asyncio.sleep(60)
                current_time = datetime.now(timezone.utc)
                stale_connections = []
                
                for user_id, connection in list(self.connections.items()):
                    if (current_time - connection.last_heartbeat).total_seconds() > 300:
                        stale_connections.append(user_id)
                        
                for user_id in stale_connections:
                    await self.remove_connection(user_id)
                    
        except asyncio.CancelledError:
            logger.info("Cleanup loop cancelled")
        except Exception as e:
            logger.error(f"Error in cleanup loop: {str(e)}")

    def get_stats(self) -> Dict[str, Any]:
        """Get current connection statistics"""
        return {
            'total_connections': len(self.connections),
            'pending_auth': len(self.pending_auth),
            'connections_by_channel': self._get_channel_stats(),
            'timestamp': datetime.now(timezone.utc).isoformat()
        }

    def _get_channel_stats(self) -> Dict[str, int]:
        """Calculate connection statistics by channel"""
        channel_stats = {}
        for connection in self.connections.values():
            for channel in connection.channels:
                channel_stats[channel] = channel_stats.get(channel, 0) + 1
        return channel_stats