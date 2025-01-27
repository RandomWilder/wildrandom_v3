# src/realtime_service/websocket/server.py

"""
WebSocket Server Implementation

Provides the core WebSocket server functionality with basic authentication 
and message routing. Forms the foundation for real-time communication.
"""

import asyncio
import websockets
import logging
from typing import Optional
from .connection_manager import ConnectionManager

logger = logging.getLogger(__name__)

class WebSocketServer:
    def __init__(self, host: str = "0.0.0.0", port: int = 8765):
        self.host = host
        self.port = port
        self.connection_manager = ConnectionManager()
        self.server: Optional[websockets.WebSocketServer] = None

    async def start(self) -> None:
        """Start WebSocket server"""
        await self.connection_manager.initialize()
        
        self.server = await websockets.serve(
            self.handle_connection,
            self.host,
            self.port
        )
        
        logger.info(f"WebSocket server started on ws://{self.host}:{self.port}")

    async def handle_connection(self, websocket, path):
        """Handle incoming WebSocket connection"""
        try:
            # Basic auth - extract token from query params or headers
            token = websocket.request_headers.get('Authorization')
            
            if not token:
                await websocket.close(1008, "Missing authentication")
                return

            user_id = await self.connection_manager.handle_connection(websocket, token)
            if not user_id:
                return  # Connection manager handled the error

            await self.handle_client_messages(websocket, user_id)
            
        except Exception as e:
            logger.error(f"Connection error: {str(e)}")
            await websocket.close(1011, "Internal server error")

    async def handle_client_messages(self, websocket, user_id: int):
        """Handle messages from connected client"""
        try:
            async for message in websocket:
                # Basic message handling - we'll expand this later
                logger.debug(f"Received message from user {user_id}: {message}")
                
        except websockets.ConnectionClosed:
            logger.info(f"Client {user_id} disconnected")
        finally:
            await self.connection_manager.remove_connection(user_id)