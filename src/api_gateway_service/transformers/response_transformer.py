# src/api_gateway_service/transformers/response_transformer.py

from typing import Any, Dict, List, Optional, Union
from datetime import datetime, timezone
import logging
from copy import deepcopy

from ..schemas.gateway_schema import ApiResponse, ResponseStatus

logger = logging.getLogger(__name__)

class ResponseTransformer:
    """
    Transforms service responses into standardized formats for frontend consumption.
    Implements response normalization, error handling, and metadata enrichment.
    """

    def transform(self, response: Any) -> ApiResponse:
        """
        Transform raw service response into standardized format.
        
        Args:
            response: Raw response from service
            
        Returns:
            Standardized API response object
        """
        try:
            if not response:
                return self._create_error_response("Empty response received")

            # Handle different response types
            if isinstance(response, dict):
                return self._transform_dict_response(response)
            elif isinstance(response, list):
                return self._transform_list_response(response)
            else:
                return self._transform_primitive_response(response)

        except Exception as e:
            logger.error(f"Response transformation error: {str(e)}", exc_info=True)
            return self._create_error_response(f"Response transformation failed: {str(e)}")

    def _transform_dict_response(self, response: Dict) -> ApiResponse:
        """
        Transform dictionary response with proper error handling and metadata.
        
        Args:
            response: Dictionary response from service
            
        Returns:
            Standardized API response
        """
        # Deep copy to prevent mutation
        transformed = deepcopy(response)
        
        # Extract standard fields if they exist
        error = transformed.pop('error', None)
        metadata = transformed.pop('metadata', {})
        
        # Determine response status
        if error:
            return self._create_error_response(error)
        
        # Enhance metadata
        enhanced_metadata = self._enhance_metadata(metadata)
        
        return ApiResponse(
            status=ResponseStatus.SUCCESS,
            data=transformed,
            metadata=enhanced_metadata
        )

    def _transform_list_response(self, response: List) -> ApiResponse:
        """
        Transform list response with pagination support.
        
        Args:
            response: List response from service
            
        Returns:
            Standardized API response with pagination metadata
        """
        transformed = deepcopy(response)
        
        metadata = {
            'count': len(transformed),
            'type': 'array'
        }
        
        return ApiResponse(
            status=ResponseStatus.SUCCESS,
            data=transformed,
            metadata=self._enhance_metadata(metadata)
        )

    def _transform_primitive_response(self, response: Any) -> ApiResponse:
        """
        Transform primitive response types.
        
        Args:
            response: Primitive response value
            
        Returns:
            Standardized API response
        """
        return ApiResponse(
            status=ResponseStatus.SUCCESS,
            data={'value': response},
            metadata=self._enhance_metadata({
                'type': type(response).__name__
            })
        )

    def _enhance_metadata(self, metadata: Dict) -> Dict:
        """
        Enhance response metadata with standard fields.
        
        Args:
            metadata: Base metadata dictionary
            
        Returns:
            Enhanced metadata dictionary
        """
        enhanced = deepcopy(metadata)
        enhanced.update({
            'timestamp': datetime.now(timezone.utc).isoformat(),
            'version': '1.0',
            'gateway_processed': True
        })
        return enhanced

    def _create_error_response(self, error_message: str) -> ApiResponse:
        """
        Create standardized error response.
        
        Args:
            error_message: Error description
            
        Returns:
            Error response object
        """
        return ApiResponse(
            status=ResponseStatus.ERROR,
            error=error_message,
            metadata=self._enhance_metadata({
                'error_type': 'transformation_error'
            })
        )