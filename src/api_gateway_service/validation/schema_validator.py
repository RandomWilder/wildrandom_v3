# src/api_gateway_service/validation/schema_validator.py

from typing import Any, Dict, Optional, Type, Union, TypeVar, Tuple
from pydantic import BaseModel, ValidationError
import logging
from functools import wraps
from flask import request, Request, Response  # Add Flask request imports
from http import HTTPStatus
import json

logger = logging.getLogger(__name__)

T = TypeVar('T', bound=BaseModel)

class ValidationException(Exception):
    """Custom exception for validation failures with detailed error reporting"""
    def __init__(self, message: str, details: Optional[Dict] = None):
        super().__init__(message)
        self.details = details or {}

class SchemaValidator:
    """
    Manages request/response schema validation with comprehensive error handling.
    Implements type-safe validation patterns for gateway data flows.
    
    Design Principles:
    - Strict type checking for all data flows
    - Detailed error reporting for frontend consumption
    - Performance-optimized validation paths
    """

    @staticmethod
    def validate_request_data(
        data: Dict,
        schema_cls: Type[T]
    ) -> Tuple[Optional[T], Optional[Dict]]:
        """
        Validate request data against provided schema.
        
        Args:
            data: Request data to validate
            schema_cls: Pydantic schema class
            
        Returns:
            Tuple of (validated model, error details)
        """
        try:
            validated = schema_cls.model_validate(data)
            return validated, None
            
        except ValidationError as e:
            logger.error(f"Validation error: {str(e)}")
            return None, {
                'message': 'Validation failed',
                'details': e.errors()
            }
            
        except Exception as e:
            logger.error(f"Unexpected validation error: {str(e)}")
            return None, {
                'message': 'Internal validation error',
                'details': str(e)
            }

    @staticmethod
    def validate_response_data(
        data: Dict,
        schema_cls: Type[T]
    ) -> Tuple[Optional[T], Optional[Dict]]:
        """
        Validate service response data against schema.
        
        Args:
            data: Response data to validate
            schema_cls: Pydantic schema class
            
        Returns:
            Tuple of (validated model, error details)
        """
        try:
            validated = schema_cls.model_validate(data)
            return validated, None
            
        except ValidationError as e:
            logger.error(f"Response validation error: {str(e)}")
            return None, {
                'message': 'Response validation failed',
                'details': e.errors()
            }
            
        except Exception as e:
            logger.error(f"Unexpected response validation error: {str(e)}")
            return None, {
                'message': 'Internal response validation error',
                'details': str(e)
            }

    @classmethod
    def request_validator(cls, schema_cls: Type[T]):
        """
        Decorator for request validation using schema.
        
        Args:
            schema_cls: Pydantic schema class for validation
            
        Returns:
            Decorator function
        """
        def decorator(func):
            @wraps(func)
            async def wrapper(*args, **kwargs):
                try:
                    # Extract request data
                    request_data = {}
                    if request.is_json:
                        request_data.update(request.get_json())
                    if request.args:
                        request_data.update(request.args.to_dict())
                    if request.form:
                        request_data.update(request.form.to_dict())

                    # Validate request data
                    validated, error = cls.validate_request_data(
                        request_data,
                        schema_cls
                    )
                    
                    if error:
                        return {
                            'status': 'error',
                            'error': error
                        }, HTTPStatus.BAD_REQUEST

                    # Call handler with validated data
                    return await func(validated, *args, **kwargs)
                    
                except Exception as e:
                    logger.error(f"Request validation failed: {str(e)}")
                    return {
                        'status': 'error',
                        'error': 'Request validation failed'
                    }, HTTPStatus.BAD_REQUEST
                    
            return wrapper
        return decorator

    @classmethod
    def response_validator(cls, schema_cls: Type[T]):
        """
        Decorator for response validation using schema.
        
        Args:
            schema_cls: Pydantic schema class for validation
            
        Returns:
            Decorator function
        """
        def decorator(func):
            @wraps(func)
            async def wrapper(*args, **kwargs):
                # Get handler response
                response = await func(*args, **kwargs)
                
                try:
                    # Validate response data
                    if isinstance(response, tuple):
                        data, status_code = response
                    else:
                        data, status_code = response, HTTPStatus.OK

                    validated, error = cls.validate_response_data(
                        data,
                        schema_cls
                    )
                    
                    if error:
                        logger.error(f"Response validation failed: {error}")
                        return {
                            'status': 'error',
                            'error': 'Response validation failed'
                        }, HTTPStatus.INTERNAL_SERVER_ERROR

                    return validated.dict(), status_code
                    
                except Exception as e:
                    logger.error(f"Response validation error: {str(e)}")
                    return {
                        'status': 'error',
                        'error': 'Response validation failed'
                    }, HTTPStatus.INTERNAL_SERVER_ERROR
                    
            return wrapper
        return decorator