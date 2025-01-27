# src/api_gateway_service/routes/composite_routes.py

from typing import Any, Dict, Optional, Union
from flask import Blueprint, request, jsonify
import logging
from http import HTTPStatus

from ..services.gateway_service import GatewayService
from ..cache.cache_manager import CacheManager
from ..cache.strategies import CacheStrategy
from ..transformers.response_transformer import ResponseTransformer
from ..validation.request_validator import validate_request
from ..schemas.gateway_schema import CompositeRequest, ApiResponse

logger = logging.getLogger(__name__)

composite_bp = Blueprint('composite', __name__, url_prefix='/api/composite')

class CompositeRouteHandler:
    """
    Handles aggregated data routes optimized for frontend consumption.
    Implements efficient data composition from multiple backend services.
    """

    def __init__(
        self,
        gateway_service: GatewayService,
        cache_manager: CacheManager
    ):
        self.gateway_service = gateway_service
        self.cache_manager = cache_manager

    @validate_request(CompositeRequest)
    async def handle_user_dashboard(self, user_id: int) -> ApiResponse:
        """
        Aggregate user dashboard data from multiple services.
        Optimized for frontend dashboard rendering with parallel requests.
        
        Args:
            user_id: User identifier
            
        Returns:
            Composite API response with dashboard data
        """
        cache_key = f"dashboard:{user_id}"
        
        # Check cache first
        cached_data = await self.cache_manager.get(cache_key)
        if cached_data:
            return ApiResponse(
                status="success",
                data=cached_data,
                metadata={"source": "cache"}
            )

        try:
            # Aggregate data from multiple services
            dashboard_data = await self.gateway_service.handle_user_composite_request(
                composite_type='user_dashboard',
                user_id=user_id,
                params={'include_active_raffles': True}
            )

            if dashboard_data:
                # Cache successful response
                await self.cache_manager.set(
                    key=cache_key,
                    value=dashboard_data,
                    expiry=CacheStrategy.USER_DASHBOARD.get_ttl()
                )

            return ApiResponse(
                status="success",
                data=dashboard_data,
                metadata={"source": "services"}
            )

        except Exception as e:
            logger.error(f"Dashboard data aggregation failed: {str(e)}", exc_info=True)
            return ApiResponse(
                status="error",
                error="Failed to aggregate dashboard data",
                metadata={"error_details": str(e)}
            )

    @validate_request(CompositeRequest)
    async def handle_raffle_details(self, raffle_id: int, user_id: Optional[int] = None) -> ApiResponse:
        """
        Aggregate comprehensive raffle details with user context.
        Optimized for raffle detail page rendering.
        
        Args:
            raffle_id: Raffle identifier
            user_id: Optional user context
            
        Returns:
            Composite API response with raffle details
        """
        cache_key = f"raffle:{raffle_id}:user:{user_id or 'anonymous'}"
        
        try:
            # Aggregate raffle data
            raffle_data = await self.gateway_service.handle_user_composite_request(
                composite_type='raffle_details',
                params={'raffle_id': raffle_id, 'user_id': user_id}
            )

            return ApiResponse(
                status="success",
                data=raffle_data,
                metadata={"source": "services"}
            )

        except Exception as e:
            logger.error(f"Raffle details aggregation failed: {str(e)}", exc_info=True)
            return ApiResponse(
                status="error",
                error="Failed to aggregate raffle details",
                metadata={"error_details": str(e)}
            )

# Initialize route handler with dependencies
def init_composite_routes(gateway_service: GatewayService, cache_manager: CacheManager):
    handler = CompositeRouteHandler(gateway_service, cache_manager)

    @composite_bp.route('/dashboard', methods=['GET'])
    async def get_user_dashboard():
        """Endpoint for aggregated user dashboard data"""
        user_id = request.current_user.id  # Assumes auth middleware sets current_user
        response = await handler.handle_user_dashboard(user_id)
        return jsonify(response.dict()), HTTPStatus.OK

    @composite_bp.route('/raffles/<int:raffle_id>', methods=['GET'])
    async def get_raffle_details(raffle_id: int):
        """Endpoint for comprehensive raffle details"""
        user_id = getattr(request.current_user, 'id', None)
        response = await handler.handle_raffle_details(raffle_id, user_id)
        return jsonify(response.dict()), HTTPStatus.OK

    return composite_bp