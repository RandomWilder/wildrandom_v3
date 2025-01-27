# src/api_gateway_service/schemas/gateway_schema.py

from typing import Any, Dict, List, Optional, Union
from datetime import datetime, timezone
from enum import Enum
from pydantic import BaseModel, Field, validator
import logging

logger = logging.getLogger(__name__)

class ResponseStatus(str, Enum):
    """
    API Response status enumeration
    
    Architectural Considerations:
    - Maps to frontend state management
    - Enables consistent error handling
    - Supports async operation states
    """
    SUCCESS = "success"
    ERROR = "error"
    PENDING = "pending"

class RequestType(str, Enum):
    """
    Request type enumeration for gateway routing
    
    Architectural Considerations:
    - Defines clear service boundaries
    - Enables request middleware selection
    - Supports routing optimization
    """
    DIRECT = "direct"      # Direct service proxy
    COMPOSITE = "composite"  # Aggregated data request
    REALTIME = "realtime"   # WebSocket/SSE requests

class ServiceEndpoint(str, Enum):
    """
    Valid service endpoints with routing rules
    
    Architectural Considerations:
    - Enforces service discovery patterns
    - Maintains service registry alignment
    - Enables routing validation
    """
    USER = "user"
    RAFFLE = "raffle"
    PAYMENT = "payment"
    PRIZE = "prize"

class BaseRequest(BaseModel):
    """
    Base request schema with common validation patterns
    
    Architectural Considerations:
    - Ensures consistent request tracking
    - Enables request tracing
    - Supports version compatibility
    """
    request_id: str = Field(
        default_factory=lambda: f"req_{int(datetime.now(timezone.utc).timestamp())}"
    )
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    client_version: Optional[str] = None

    @validator('client_version')
    def validate_client_version(cls, v: Optional[str]) -> Optional[str]:
        """Validate client version format"""
        if v and not v.replace('.', '').isdigit():
            raise ValueError("Invalid client version format")
        return v

class ProxyRequest(BaseRequest):
    """
    Schema for direct service proxy requests
    
    Architectural Considerations:
    - Enforces valid service routing
    - Maintains HTTP method safety
    - Enables request validation
    """
    service: ServiceEndpoint
    endpoint: str = Field(min_length=1)
    method: str = Field(pattern="^(GET|POST|PUT|DELETE)$")
    data: Optional[Dict[str, Any]] = None
    params: Optional[Dict[str, Any]] = None

    @validator('endpoint')
    def validate_endpoint(cls, v: str) -> str:
        """Ensure proper endpoint path format"""
        if not v.startswith('/'):
            v = f"/{v}"
        return v

class CompositeRequest(BaseRequest):
    """
    Schema for composite data requests
    
    Architectural Considerations:
    - Supports data aggregation
    - Enables cache strategy selection
    - Maintains component isolation
    """
    composite_type: str = Field(description="Type of composite request")
    components: List[str] = Field(min_items=1)
    params: Optional[Dict[str, Any]] = Field(default_factory=dict)
    cache_strategy: Optional[str] = Field(
        default="default",
        description="Caching strategy for composite response"
    )

class ApiResponse(BaseModel):
    """
    Standardized API response format
    
    Architectural Considerations:
    - Ensures consistent error handling
    - Supports frontend state mapping
    - Enables response caching
    """
    status: ResponseStatus
    data: Optional[Union[Dict[str, Any], List[Any]]] = None
    error: Optional[str] = None
    metadata: Dict[str, Any] = Field(default_factory=dict)

    @validator('metadata')
    def ensure_timestamp(cls, v: Dict[str, Any]) -> Dict[str, Any]:
        """Ensure response metadata includes timestamp"""
        if 'timestamp' not in v:
            v['timestamp'] = datetime.now(timezone.utc).isoformat()
        return v

class ErrorResponse(BaseModel):
    """
    Standardized error response format
    
    Architectural Considerations:
    - Provides detailed error context
    - Supports error tracking
    - Enables frontend error handling
    """
    error_code: str
    message: str
    details: Optional[Dict[str, Any]] = None
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    request_id: Optional[str] = None

# Export all relevant types
__all__ = [
    'ResponseStatus',
    'RequestType',
    'ServiceEndpoint',
    'BaseRequest',
    'ProxyRequest',
    'CompositeRequest',
    'ApiResponse',
    'ErrorResponse'
]