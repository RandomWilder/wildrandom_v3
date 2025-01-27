# src/api_gateway_service/validation/request_validator.py

from typing import Type, Callable, Any
from functools import wraps
from flask import request, jsonify
from http import HTTPStatus
import logging

from .schema_validator import SchemaValidator, ValidationException
from ..schemas.gateway_schema import ApiResponse

logger = logging.getLogger(__name__)

def validate_request(schema_cls: Type[Any]) -> Callable:
    """
    Decorator for validating incoming requests against schema.
    Implements comprehensive request validation with error handling.
    
    Args:
        schema_cls: Schema class for validation
        
    Returns:
        Decorator function
        
    Design Notes:
    - Integrates with frontend error handling patterns
    - Provides detailed validation feedback
    - Maintains consistent error response format
    """
    def decorator(func: Callable) -> Callable:
        @wraps(func)
        async def wrapper(*args, **kwargs) -> Any:
            try:
                # Combine request data from multiple sources
                request_data = {}
                
                # JSON data
                if request.is_json:
                    request_data.update(request.get_json())
                
                # Query parameters
                if request.args:
                    request_data.update(request.args.to_dict())
                
                # Form data
                if request.form:
                    request_data.update(request.form.to_dict())
                
                # URL parameters
                request_data.update(kwargs)

                # Validate request data
                validator = SchemaValidator()
                validated_data, validation_error = validator.validate_request_data(
                    request_data,
                    schema_cls
                )

                if validation_error:
                    return ApiResponse(
                        status="error",
                        error="Validation failed",
                        metadata={"validation_errors": validation_error}
                    ).dict(), HTTPStatus.BAD_REQUEST

                # Update kwargs with validated data
                kwargs.update(validated_data.dict())
                
                # Execute handler with validated data
                return await func(*args, **kwargs)
                
            except ValidationException as e:
                logger.error(f"Validation exception: {str(e)}")
                return ApiResponse(
                    status="error",
                    error=str(e),
                    metadata={"validation_errors": e.details}
                ).dict(), HTTPStatus.BAD_REQUEST
                
            except Exception as e:
                logger.error(f"Request validation error: {str(e)}", exc_info=True)
                return ApiResponse(
                    status="error",
                    error="Internal validation error"
                ).dict(), HTTPStatus.INTERNAL_SERVER_ERROR
                
        return wrapper
    return decorator