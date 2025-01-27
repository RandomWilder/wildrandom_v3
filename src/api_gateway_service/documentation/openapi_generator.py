# src/api_gateway_service/documentation/openapi_generator.py

"""
Enhanced OpenAPI Generator for API Gateway Documentation

This module extends our documentation generator to properly inspect and document our service routes,
focusing on composite and proxy endpoints that form our API Gateway's core functionality.

Architectural Considerations:
- Complete route inspection and documentation
- Schema transformation and validation
- Frontend-optimized type definitions
- Security and permission mapping
- Cache strategy documentation
"""

from typing import Dict, List, Optional, Any, Type
from pathlib import Path
import logging
from datetime import datetime, timezone
from pydantic import BaseModel

from src.api_gateway_service.routes import composite_routes, proxy_routes
from src.api_gateway_service.schemas.gateway_schema import (
    ApiResponse, BaseRequest, ProxyRequest, CompositeRequest,
    ServiceEndpoint, RequestType
)

logger = logging.getLogger(__name__)

class RouteMetadata:
    """Rich metadata for API route documentation"""
    def __init__(
        self,
        path: str,
        method: str,
        summary: str,
        description: str,
        tags: List[str],
        request_schema: Optional[Type[BaseModel]] = None,
        response_schema: Optional[Type[BaseModel]] = None,
        cache_strategy: Optional[str] = None,
        security: bool = True
    ):
        self.path = path
        self.method = method
        self.summary = summary
        self.description = description
        self.tags = tags
        self.request_schema = request_schema
        self.response_schema = response_schema
        self.cache_strategy = cache_strategy
        self.security = security

class EnhancedOpenAPIGenerator:
    """Enhanced OpenAPI specification generator with route inspection"""
    
    def __init__(self, output_dir: Path):
        self.output_dir = output_dir
        self.routes_metadata: Dict[str, RouteMetadata] = {}

    def _inspect_composite_routes(self) -> Dict[str, Any]:
        """Inspect and document composite routes"""
        paths = {}
        
        # Dashboard endpoint
        paths["/api/composite/dashboard"] = {
            "get": {
                "summary": "Get User Dashboard Data",
                "description": "Aggregates user dashboard data including profile, active raffles, and loyalty status",
                "tags": ["Dashboard"],
                "security": [{"bearerAuth": []}],
                "responses": {
                    "200": {
                        "description": "Dashboard data retrieved successfully",
                        "content": {
                            "application/json": {
                                "schema": {"$ref": "#/components/schemas/DashboardResponse"}
                            }
                        }
                    }
                },
                "x-cache-strategy": "user_dashboard"
            }
        }
        
        # Raffle details endpoint
        paths["/api/composite/raffles/{raffle_id}"] = {
            "get": {
                "summary": "Get Comprehensive Raffle Details",
                "description": "Retrieves complete raffle information with user context",
                "tags": ["Raffles"],
                "parameters": [{
                    "name": "raffle_id",
                    "in": "path",
                    "required": True,
                    "schema": {"type": "integer"}
                }],
                "security": [{"bearerAuth": []}],
                "responses": {
                    "200": {
                        "description": "Raffle details retrieved successfully",
                        "content": {
                            "application/json": {
                                "schema": {"$ref": "#/components/schemas/RaffleDetailResponse"}
                            }
                        }
                    }
                },
                "x-cache-strategy": "raffle_details"
            }
        }
        
        return paths

    def _inspect_proxy_routes(self) -> Dict[str, Any]:
        """Inspect and document proxy routes"""
        paths = {}
        
        # Generic proxy endpoint template
        paths["/api/{service}/{path}"] = {
            "parameters": [
                {
                    "name": "service",
                    "in": "path",
                    "required": True,
                    "schema": {
                        "type": "string",
                        "enum": [s.value for s in ServiceEndpoint]
                    }
                },
                {
                    "name": "path",
                    "in": "path",
                    "required": True,
                    "schema": {"type": "string"}
                }
            ],
            "get": self._build_proxy_operation("get"),
            "post": self._build_proxy_operation("post"),
            "put": self._build_proxy_operation("put"),
            "delete": self._build_proxy_operation("delete")
        }
        
        return paths

    def _build_proxy_operation(self, method: str) -> Dict[str, Any]:
        """Build OpenAPI operation object for proxy endpoints"""
        return {
            "summary": f"Proxy {method.upper()} Request",
            "description": f"Proxies {method.upper()} requests to underlying services",
            "tags": ["Proxy"],
            "security": [{"bearerAuth": []}],
            "requestBody": {
                "content": {
                    "application/json": {
                        "schema": {"$ref": "#/components/schemas/ProxyRequest"}
                    }
                }
            } if method in ["post", "put"] else None,
            "responses": {
                "200": {
                    "description": "Request processed successfully",
                    "content": {
                        "application/json": {
                            "schema": {"$ref": "#/components/schemas/ApiResponse"}
                        }
                    }
                }
            }
        }

    def _generate_schemas(self) -> Dict[str, Any]:
        """Generate OpenAPI schemas with updated validation patterns"""
        return {
            "ApiResponse": {
                "type": "object",
                "properties": {
                    "status": {
                        "type": "string",
                        "pattern": "^(success|error|pending)$"
                    },
                    "data": {"type": "object"},
                    "error": {"type": "string"},
                    "metadata": {
                        "type": "object",
                        "additionalProperties": True
                    }
                },
                "required": ["status", "metadata"]
            },
            "ProxyRequest": {
                "type": "object",
                "properties": {
                    "service": {
                        "type": "string",
                        "enum": [s.value for s in ServiceEndpoint]
                    },
                    "endpoint": {
                        "type": "string",
                        "minLength": 1
                    },
                    "method": {
                        "type": "string",
                        "pattern": "^(GET|POST|PUT|DELETE)$"
                    },
                    "data": {"type": "object"},
                    "params": {"type": "object"}
                },
                "required": ["service", "endpoint", "method"]
            },
            "DashboardResponse": {
                "type": "object",
                "properties": {
                    "profile": {"$ref": "#/components/schemas/UserProfile"},
                    "active_raffles": {
                        "type": "array",
                        "items": {"$ref": "#/components/schemas/RaffleSummary"}
                    },
                    "loyalty": {"$ref": "#/components/schemas/LoyaltyStatus"}
                }
            },
            # Add more schemas as needed
        }

    def generate(self) -> None:
        """Generate complete OpenAPI specification"""
        try:
            spec = {
                "openapi": "3.0.3",
                "info": {
                    "title": "WildRandom API Gateway",
                    "version": "1.0.0",
                    "description": "Frontend-optimized API Gateway for WildRandom platform",
                },
                "servers": [{"url": "/api"}],
                "paths": {
                    **self._inspect_composite_routes(),
                    **self._inspect_proxy_routes()
                },
                "components": {
                    "schemas": self._generate_schemas(),
                    "securitySchemes": {
                        "bearerAuth": {
                            "type": "http",
                            "scheme": "bearer",
                            "bearerFormat": "JWT"
                        }
                    }
                },
                "tags": [
                    {"name": "Dashboard", "description": "Dashboard operations"},
                    {"name": "Raffles", "description": "Raffle operations"},
                    {"name": "Proxy", "description": "Service proxy operations"}
                ]
            }

            import yaml
            output_file = self.output_dir / "openapi.yaml"
            with open(output_file, 'w') as f:
                yaml.dump(spec, f, sort_keys=False)

            logger.info(f"Enhanced OpenAPI specification generated at {output_file}")

        except Exception as e:
            logger.error(f"OpenAPI generation failed: {str(e)}")
            raise