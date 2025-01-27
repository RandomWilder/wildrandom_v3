# tests/realtime_service/websocket_test_utils.py

"""
WebSocket Testing Utilities

Provides testing infrastructure for WebSocket functionality with
proper async support and connection simulation.

Architectural Considerations:
- Test Isolation: Maintains clean test environment
- Connection Simulation: Mocks WebSocket connections
- State Verification: Validates connection states
- Resource Management: Handles cleanup
"""

import asyncio
from typing import Optional, Dict, Any
from dataclasses import dataclass
from datetime import datetime, timezone

@dataclass
class MockWebSocket:
    """Mock WebSocket connection for testing"""
    
    closed: bool = False
    close_code: Optional[int] = None
    close_reason: Optional[str] = None
    
    async def close(self, code: int = 1000, reason: str = "") -> None:
        """Simulate connection close"""
        self.closed = True
        self.close_code = code
        self.close_reason = reason
    
    async def send(self, message: str) -> None:
        """Simulate message sending"""
        if self.closed:
            raise ConnectionError("Connection closed")

def create_mock_token(user_id: int = 123) -> str:
    """Create mock authentication token"""
    return f"mock_token_{user_id}_valid"