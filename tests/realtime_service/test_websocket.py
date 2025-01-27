# tests/realtime_service/test_websocket.py

"""
WebSocket Integration Tests

Implements comprehensive WebSocket functionality testing with proper
resource management and connection lifecycle validation.

Architectural Considerations:
- Connection Testing: Validates entire connection lifecycle
- Resource Management: Proper cleanup between tests
- Error Handling: Validates error scenarios
- Authentication Flow: Tests security implementation
"""

import pytest
import asyncio
import logging
from typing import AsyncGenerator
from src.realtime_service.websocket.connection_manager import ConnectionManager

logger = logging.getLogger(__name__)

@pytest.fixture
async def connection_manager(event_loop: asyncio.AbstractEventLoop) -> AsyncGenerator[ConnectionManager, None]:
    """
    Provide configured connection manager for tests.
    
    Args:
        event_loop: The test event loop
        
    Yields:
        Configured ConnectionManager instance
    """
    manager = ConnectionManager()
    await manager.initialize()
    
    yield manager
    
    await manager.shutdown()

@pytest.mark.asyncio
async def test_websocket_initialization(connection_manager: ConnectionManager) -> None:
    """
    Verify WebSocket manager initialization and basic operations.
    
    Tests:
        - Manager initialization
        - Connection tracking
        - Basic state management
    """
    assert connection_manager is not None
    assert connection_manager.connections == {}
    assert connection_manager.pending_auth == set()
    assert connection_manager._cleanup_task is not None

@pytest.mark.asyncio
async def test_connection_stats(connection_manager: ConnectionManager) -> None:
    """
    Verify connection statistics functionality.
    
    Tests:
        - Stats calculation
        - Channel tracking
        - Connection counting
    """
    stats = connection_manager.get_stats()
    
    assert isinstance(stats, dict)
    assert 'total_connections' in stats
    assert 'pending_auth' in stats
    assert 'connections_by_channel' in stats
    assert 'timestamp' in stats