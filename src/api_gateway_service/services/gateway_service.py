# src/api_gateway_service/services/gateway_service.py

from typing import Any, Dict, Optional, Tuple, Union
from datetime import datetime, timezone
import logging
from sqlalchemy.exc import SQLAlchemyError

from src.shared import db
from ..schemas.gateway_schema import ApiResponse
from ..transformers.response_transformer import ResponseTransformer
from ..cache.cache_manager import CacheManager
from .proxy_service import ProxyService  # Add proper import

logger = logging.getLogger(__name__)

class GatewayService:
    """
    Core gateway service handling user request orchestration and response management.
    Implements high-level routing logic and cross-cutting concerns.
    """

    def __init__(
        self, 
        cache_manager: CacheManager, 
        response_transformer: ResponseTransformer,
        proxy_service: ProxyService  # Add proxy service dependency
    ):
        """
        Initialize gateway service with required dependencies.
        
        Args:
            cache_manager: Service for handling response caching
            response_transformer: Service for response standardization
            proxy_service: Service for handling inter-service communication
        """
        self.cache_manager = cache_manager
        self.response_transformer = response_transformer
        self.proxy_service = proxy_service  # Store proxy service instance

    async def handle_user_request(
        self, 
        service_name: str, 
        endpoint: str, 
        method: str,
        data: Optional[Dict] = None,
        params: Optional[Dict] = None
    ) -> Tuple[Optional[ApiResponse], Optional[str]]:
        """
        Handle incoming user requests with response caching and transformation.
        
        Args:
            service_name: Target microservice name
            endpoint: Service endpoint path
            method: HTTP method
            data: Request body data
            params: Query parameters
            
        Returns:
            Tuple containing transformed response or error message
        """
        try:
            # Check cache for GET requests
            cache_key = None
            if method == 'GET':
                cache_key = f"{service_name}:{endpoint}:{str(params)}"
                cached_response = await self.cache_manager.get(cache_key)
                if cached_response:
                    return cached_response, None

            # Process request through proxy service
            response = await self.proxy_service.forward_request(  # Use instance method
                service_name=service_name,
                endpoint=endpoint,
                method=method,
                data=data,
                params=params
            )

            if not response:
                return None, "Service request failed"

            # Transform response to standard format
            transformed = self.response_transformer.transform(response)

            # Cache successful GET responses
            if method == 'GET' and cache_key:
                await self.cache_manager.set(cache_key, transformed)

            return transformed, None

        except Exception as e:
            logger.error(f"Gateway error: {str(e)}", exc_info=True)
            return None, f"Gateway error: {str(e)}"

    async def handle_user_composite_request(
        self,
        composite_type: str,
        user_id: int,
        params: Optional[Dict] = None
    ) -> Tuple[Optional[Dict], Optional[str]]:
        """
        Handle composite requests requiring data from multiple services.
        Optimized for user dashboard and profile views.
        
        Args:
            composite_type: Type of composite request
            user_id: User identifier
            params: Additional parameters
            
        Returns:
            Tuple containing aggregated response or error message
        """
        try:
            # Check composite request cache
            cache_key = f"composite:{composite_type}:{user_id}:{str(params)}"
            cached_response = await self.cache_manager.get(cache_key)
            if cached_response:
                return cached_response, None

            response_data = {}
            
            # Handle different composite types
            if composite_type == 'user_dashboard':
                # Gather user profile data
                user_data = await self.proxy_service.forward_request(  # Use instance method
                    service_name='user',
                    endpoint=f'/users/{user_id}/profile',
                    method='GET'
                )
                if user_data:
                    response_data['profile'] = user_data

                # Get active raffles
                raffle_data = await self.proxy_service.forward_request(  # Use instance method
                    service_name='raffle',
                    endpoint='/raffles/active',
                    method='GET'
                )
                if raffle_data:
                    response_data['active_raffles'] = raffle_data

                # Get loyalty status
                loyalty_data = await self.proxy_service.forward_request(  # Use instance method
                    service_name='user',
                    endpoint=f'/users/{user_id}/loyalty',
                    method='GET'
                )
                if loyalty_data:
                    response_data['loyalty'] = loyalty_data

            # Cache successful composite responses
            if response_data:
                await self.cache_manager.set(
                    cache_key, 
                    response_data,
                    expiry=300  # 5 minutes cache for composite data
                )

            return response_data, None

        except Exception as e:
            logger.error(f"Composite request error: {str(e)}", exc_info=True)
            return None, f"Composite request failed: {str(e)}"