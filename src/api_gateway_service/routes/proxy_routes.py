# src/api_gateway_service/routes/proxy_routes.py

from typing import Any, Dict, Optional
from flask import Blueprint, request, jsonify
import logging
from http import HTTPStatus

from ..services.gateway_service import GatewayService
from ..validation.request_validator import validate_request
from ..schemas.gateway_schema import ProxyRequest

logger = logging.getLogger(__name__)

proxy_bp = Blueprint('proxy', __name__, url_prefix='/api')

class ProxyRouteHandler:
    """
    Handles direct service proxying with request validation and transformation.
    Implements clean routing patterns for frontend-to-service communication.
    """

    def __init__(self, gateway_service: GatewayService):
        self.gateway_service = gateway_service

    @validate_request(ProxyRequest)
    async def handle_proxy_request(
        self,
        service: str,
        path: str,
        method: str,
        data: Optional[Dict] = None
    ) -> Any:
        """
        Handle proxied service request with validation and transformation.
        
        Args:
            service: Target service name
            path: Service endpoint path
            method: HTTP method
            data: Request payload
            
        Returns:
            Transformed service response
        """
        try:
            response = await self.gateway_service.handle_user_request(
                service_name=service,
                endpoint=path,
                method=method,
                data=data,
                params=request.args.to_dict()
            )

            if not response:
                return jsonify({
                    'status': 'error',
                    'error': 'Service request failed'
                }), HTTPStatus.BAD_GATEWAY

            return jsonify(response.dict()), HTTPStatus.OK

        except Exception as e:
            logger.error(f"Proxy request failed: {str(e)}", exc_info=True)
            return jsonify({
                'status': 'error',
                'error': 'Failed to process service request'
            }), HTTPStatus.INTERNAL_SERVER_ERROR

# Initialize route handler with dependencies
def init_proxy_routes(gateway_service: GatewayService):
    handler = ProxyRouteHandler(gateway_service)

    @proxy_bp.route('/<service>/<path:path>', methods=['GET', 'POST', 'PUT', 'DELETE'])
    async def proxy_request(service: str, path: str):
        """Dynamic proxy endpoint for service requests"""
        return await handler.handle_proxy_request(
            service=service,
            path=path,
            method=request.method,
            data=request.get_json() if request.is_json else None
        )

    return proxy_bp