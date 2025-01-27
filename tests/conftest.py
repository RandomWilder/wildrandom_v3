# tests/conftest.py

"""
Global Test Configuration

Implements foundational test infrastructure with proper async support and
WebSocket testing capabilities. Ensures consistent test environment across
all service boundaries.

Architectural Considerations:
- Async Testing: Proper event loop management
- Resource Lifecycle: Systematic cleanup procedures
- Cross-Service Testing: Maintains service isolation
- Type Safety: Runtime type verification
"""

import os
import sys
from pathlib import Path
import pytest
import asyncio
from typing import AsyncGenerator
import logging

# Add project root to Python path
project_root = str(Path(__file__).parent.parent)
sys.path.append(project_root)

# Configure logging for tests
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

@pytest.fixture(scope="session")
def event_loop() -> AsyncGenerator[asyncio.AbstractEventLoop, None]:
    """
    Create and manage event loop for the test session.
    
    Returns:
        AsyncGenerator yielding the event loop
    
    Note:
        Uses session scope to maintain single loop across related tests
        while ensuring proper cleanup.
    """
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    
    yield loop
    
    pending = asyncio.all_tasks(loop)
    loop.run_until_complete(asyncio.gather(*pending, return_exceptions=True))
    loop.run_until_complete(loop.shutdown_asyncgens())
    loop.close()