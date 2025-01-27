# src/api_gateway_service/schemas/response_schema.py

from typing import Any, Dict, List, Optional, Union, Generic, TypeVar
from datetime import datetime
from pydantic import BaseModel, Field, validator
from pydantic.generics import GenericModel

T = TypeVar('T')

class PaginationMetadata(BaseModel):
    """
    Pagination metadata for list responses.
    Enables frontend pagination implementation.
    """
    total_count: int
    page_size: int
    current_page: int
    total_pages: int
    has_next: bool
    has_previous: bool

class DataResponse(GenericModel, Generic[T]):
    """
    Generic data response wrapper.
    Provides consistent structure for all data responses.
    """
    data: T
    metadata: Dict[str, Any] = Field(default_factory=dict)
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class ListResponse(GenericModel, Generic[T]):
    """
    Generic list response with pagination.
    Optimized for frontend list rendering.
    """
    items: List[T]
    pagination: PaginationMetadata
    metadata: Dict[str, Any] = Field(default_factory=dict)

class UserContext(BaseModel):
    """
    User context information for responses.
    Provides frontend with user-specific data.
    """
    user_id: int
    permissions: List[str]
    features: Dict[str, bool]
    preferences: Dict[str, Any]

class EnhancedResponse(BaseModel):
    """
    Enhanced response with additional context.
    Provides rich metadata for frontend optimization.
    """
    data: Any
    user_context: Optional[UserContext] = None
    cache_info: Optional[Dict[str, Any]] = None
    server_timing: Optional[Dict[str, float]] = None
    client_hints: Optional[Dict[str, Any]] = None

    @validator('server_timing', pre=True)
    def validate_timing(cls, v: Optional[Dict[str, float]]) -> Optional[Dict[str, float]]:
        """Validate server timing metrics"""
        if v is None:
            return None
        return {k: round(float(v), 3) for k, v in v.items()}