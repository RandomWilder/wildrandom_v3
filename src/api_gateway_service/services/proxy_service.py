# src/api_gateway_service/services/proxy_service.py

from typing import Any, Dict, Optional, Union
from aiohttp import ClientSession, ClientTimeout
from urllib.parse import urljoin
import json
import logging
from datetime import datetime, timezone

# Import shared configurations and types
from src.shared.config import config
from ..schemas.gateway_schema import ApiResponse, ResponseStatus

logger = logging.getLogger(__name__)

class ServiceConnectionError(Exception):
    """Custom exception for service connection failures"""
    pass

class ProxyService:
    """
    Handles inter-service communication with robust error handling and timeout management.
    Implements retry logic and circuit breaking for resilient service communication.
    """

    def __init__(
        self,
        timeout_seconds: int = 30,
        max_retries: int = 3,
        service_registry: Optional[Dict[str, str]] = None
    ):
        """
        Initialize proxy service with configuration parameters.
        
        Args:
            timeout_seconds: Request timeout duration
            max_retries: Maximum retry attempts for failed requests 
            service_registry: Mapping of service names to base URLs
        """
        self.timeout = ClientTimeout(total=timeout_seconds)
        self.max_retries = max_retries
        self.service_registry = service_registry or {
            'user': config.USER_SERVICE_URL,
            'raffle': config.RAFFLE_SERVICE_URL,
            'payment': config.PAYMENT_SERVICE_URL,
            'prize': config.PRIZE_SERVICE_URL
        }
        
        # Circuit breaker state
        self._failed_attempts: Dict[str, int] = {}
        self._circuit_open: Dict[str, bool] = {}

    async def forward_request(
        self,
        service_name: str,
        endpoint: str,
        method: str,
        data: Optional[Dict] = None,
        params: Optional[Dict] = None,
        retry_count: int = 0
    ) -> Optional[ApiResponse]:
        """
        Forward request to appropriate service with retry logic and circuit breaking.
        
        Args:
            service_name: Target microservice name
            endpoint: Service endpoint path
            method: HTTP method
            data: Request body
            params: Query parameters
            retry_count: Current retry attempt number
            
        Returns:
            Standardized API response or None if request fails
            
        Raises:
            ServiceConnectionError: If service communication fails after retries
        """
        if not self._can_make_request(service_name):
            logger.warning(f"Circuit breaker open for service: {service_name}")
            return self._create_error_response("Service temporarily unavailable")

        base_url = self.service_registry.get(service_name)
        if not base_url:
            logger.error(f"Unknown service: {service_name}")
            return self._create_error_response("Invalid service")

        url = urljoin(base_url, endpoint.lstrip('/'))

        try:
            async with ClientSession(timeout=self.timeout) as session:
                async with session.request(
                    method=method.upper(),
                    url=url,
                    json=data if data else None,
                    params=params if params else None,
                    headers=self._get_request_headers()
                ) as response:
                    
                    response_data = await response.json()
                    
                    if response.status >= 500:
                        return await self._handle_service_error(
                            service_name, 
                            endpoint, 
                            method, 
                            data, 
                            params, 
                            retry_count
                        )
                    
                    self._reset_circuit_breaker(service_name)
                    return self._create_success_response(response_data)

        except Exception as e:
            logger.error(f"Request failed for {service_name}: {str(e)}")
            return await self._handle_service_error(
                service_name, 
                endpoint, 
                method, 
                data, 
                params, 
                retry_count
            )

    def _can_make_request(self, service_name: str) -> bool:
        """Check if service circuit breaker allows requests"""
        return not self._circuit_open.get(service_name, False)

    def _reset_circuit_breaker(self, service_name: str) -> None:
        """Reset circuit breaker state after successful request"""
        self._failed_attempts[service_name] = 0
        self._circuit_open[service_name] = False

    async def _handle_service_error(
        self,
        service_name: str,
        endpoint: str,
        method: str,
        data: Optional[Dict],
        params: Optional[Dict],
        retry_count: int
    ) -> Optional[ApiResponse]:
        """
        Handle service errors with retry logic and circuit breaking.
        
        Args:
            service_name: Target microservice name
            endpoint: Service endpoint path
            method: HTTP method
            data: Request body
            params: Query parameters
            retry_count: Current retry attempt number
            
        Returns:
            API response or None if all retries fail
        """
        self._failed_attempts[service_name] = self._failed_attempts.get(service_name, 0) + 1
        
        if self._failed_attempts[service_name] >= self.max_retries:
            self._circuit_open[service_name] = True
            logger.error(f"Circuit breaker opened for service: {service_name}")
            return self._create_error_response("Service temporarily unavailable")
            
        if retry_count < self.max_retries:
            logger.warning(f"Retrying request to {service_name} ({retry_count + 1}/{self.max_retries})")
            return await self.forward_request(
                service_name=service_name,
                endpoint=endpoint,
                method=method,
                data=data,
                params=params,
                retry_count=retry_count + 1
            )
            
        return self._create_error_response("Service request failed")

    def _get_request_headers(self) -> Dict[str, str]:
        """Generate standard request headers"""
        return {
            'Content-Type': 'application/json',
            'X-Request-Time': datetime.now(timezone.utc).isoformat()
        }

    def _create_success_response(self, data: Any) -> ApiResponse:
        """Create standardized success response"""
        return ApiResponse(
            status=ResponseStatus.SUCCESS,
            data=data,
            metadata={'timestamp': datetime.now(timezone.utc)}
        )

    def _create_error_response(self, error_message: str) -> ApiResponse:
        """Create standardized error response"""
        return ApiResponse(
            status=ResponseStatus.ERROR,
            error=error_message,
            metadata={'timestamp': datetime.now(timezone.utc)}
        )