# src/realtime_service/events/event_validator.py

"""
Event Validation Module

Implements comprehensive event validation with schema enforcement,
data consistency checks, and proper error handling. Ensures all events
meet system requirements before processing.

Features:
- Schema validation
- Data consistency checks
- Type safety enforcement
- Custom validation rules
"""

# Standard library imports
from typing import Dict, Optional, Any, List, Union, Type
from datetime import datetime, timezone
import logging
from enum import Enum

# Third-party imports
from pydantic import BaseModel, Field, validator

# Local imports
from .event_types import Event, EventType, EventCategory, EventMetadata

logger = logging.getLogger(__name__)

class ValidationResult(BaseModel):
    """Structured validation result"""
    valid: bool
    errors: List[str] = Field(default_factory=list)
    warnings: List[str] = Field(default_factory=list)
    metadata: Dict[str, Any] = Field(default_factory=dict)

class EventSchemaValidator:
    """
    Validates event schema and data consistency
    
    Features:
    - Type validation
    - Required field checking
    - Data format validation
    - Custom rule enforcement
    """

    def __init__(self):
        self.custom_validators: Dict[EventType, List[callable]] = {}
        self._initialize_validators()

    def validate_event(self, event: Event) -> ValidationResult:
        """
        Validate event against schema and business rules
        
        Args:
            event: Event to validate
            
        Returns:
            ValidationResult: Validation outcome with details
        """
        try:
            errors = []
            warnings = []
            
            # Basic schema validation
            schema_errors = self._validate_schema(event)
            if schema_errors:
                errors.extend(schema_errors)
            
            # Data consistency
            consistency_errors = self._validate_consistency(event)
            if consistency_errors:
                errors.extend(consistency_errors)
            
            # Custom validation rules
            custom_validation = self._apply_custom_validators(event)
            errors.extend(custom_validation.get('errors', []))
            warnings.extend(custom_validation.get('warnings', []))
            
            return ValidationResult(
                valid=len(errors) == 0,
                errors=errors,
                warnings=warnings,
                metadata={
                    'validated_at': datetime.now(timezone.utc).isoformat(),
                    'validation_version': '1.0'
                }
            )
            
        except Exception as e:
            logger.error(f"Validation error: {str(e)}", exc_info=True)
            return ValidationResult(
                valid=False,
                errors=[f"Validation failed: {str(e)}"]
            )

    def register_validator(
        self,
        event_type: EventType,
        validator_func: callable
    ) -> None:
        """Register custom validator for event type"""
        if event_type not in self.custom_validators:
            self.custom_validators[event_type] = []
        self.custom_validators[event_type].append(validator_func)

    def _initialize_validators(self) -> None:
        """Initialize default validators"""
        # Register system event validators
        self.register_validator(
            EventType.CONNECTION_ESTABLISHED,
            self._validate_connection_event
        )
        
        # Register raffle event validators
        self.register_validator(
            EventType.RAFFLE_STATE_CHANGE,
            self._validate_raffle_state_change
        )
        
        # Register user event validators
        self.register_validator(
            EventType.BALANCE_UPDATE,
            self._validate_balance_update
        )

    def _validate_schema(self, event: Event) -> List[str]:
        """Validate basic event schema"""
        errors = []
        
        # Required fields
        if not event.type:
            errors.append("Event type is required")
        if not event.category:
            errors.append("Event category is required")
            
        # Type validation
        if not isinstance(event.data, dict):
            errors.append("Event data must be a dictionary")
            
        # Metadata validation
        if not event.metadata or not isinstance(event.metadata, EventMetadata):
            errors.append("Invalid event metadata")
            
        return errors

    def _validate_consistency(self, event: Event) -> List[str]:
        """Validate data consistency"""
        errors = []
        
        # Category/Type consistency
        if event.category == EventCategory.RAFFLE and not self._is_valid_raffle_event(event):
            errors.append("Invalid raffle event configuration")
            
        # Target validation
        if event.target_user_id and event.broadcast_channel:
            errors.append("Event cannot have both target user and broadcast channel")
            
        return errors

    def _apply_custom_validators(self, event: Event) -> Dict[str, List[str]]:
        """Apply custom validation rules"""
        result = {
            'errors': [],
            'warnings': []
        }
        
        if event.type in self.custom_validators:
            for validator in self.custom_validators[event.type]:
                try:
                    validator_result = validator(event)
                    if isinstance(validator_result, dict):
                        result['errors'].extend(validator_result.get('errors', []))
                        result['warnings'].extend(validator_result.get('warnings', []))
                except Exception as e:
                    logger.error(f"Custom validator failed: {str(e)}")
                    result['errors'].append(f"Validation error: {str(e)}")
                    
        return result

    # Custom validators
    def _validate_connection_event(self, event: Event) -> Dict[str, List[str]]:
        """Validate connection event data"""
        errors = []
        warnings = []
        
        if 'user_id' not in event.data:
            errors.append("Connection event requires user_id")
            
        return {
            'errors': errors,
            'warnings': warnings
        }

    def _validate_raffle_state_change(self, event: Event) -> Dict[str, List[str]]:
        """Validate raffle state change event"""
        errors = []
        warnings = []
        
        required_fields = ['raffle_id', 'new_state', 'previous_state']
        for field in required_fields:
            if field not in event.data:
                errors.append(f"Missing required field: {field}")
                
        return {
            'errors': errors,
            'warnings': warnings
        }

    def _validate_balance_update(self, event: Event) -> Dict[str, List[str]]:
        """Validate balance update event"""
        errors = []
        warnings = []
        
        if 'amount' not in event.data:
            errors.append("Balance update requires amount field")
        elif not isinstance(event.data['amount'], (int, float)):
            errors.append("Balance amount must be numeric")
            
        return {
            'errors': errors,
            'warnings': warnings
        }

    def _is_valid_raffle_event(self, event: Event) -> bool:
        """
        Validate raffle event configuration
        
        Ensures raffle events maintain data consistency and required fields
        based on their specific event types.
        
        Args:
            event: Raffle-related event to validate
            
        Returns:
            bool: True if event configuration is valid
        """
        try:
            if event.type == EventType.RAFFLE_STATE_CHANGE:
                return self._validate_raffle_state_data(event.data)
            elif event.type == EventType.TICKET_PURCHASED:
                return self._validate_ticket_purchase_data(event.data)
            elif event.type == EventType.TICKET_REVEALED:
                return self._validate_ticket_reveal_data(event.data)
            elif event.type == EventType.PRIZE_WON:
                return self._validate_prize_win_data(event.data)
            
            return False
            
        except Exception as e:
            logger.error(f"Raffle event validation error: {str(e)}")
            return False

    def _validate_raffle_state_data(self, data: Dict[str, Any]) -> bool:
        """
        Validate raffle state change data
        
        Args:
            data: Event data payload
            
        Returns:
            bool: True if data is valid
        """
        required_fields = {
            'raffle_id': int,
            'new_state': str,
            'previous_state': str,
            'timestamp': str
        }
        
        return all(
            isinstance(data.get(field), field_type)
            for field, field_type in required_fields.items()
        )

    def _validate_ticket_purchase_data(self, data: Dict[str, Any]) -> bool:
        """
        Validate ticket purchase event data
        
        Args:
            data: Event data payload
            
        Returns:
            bool: True if data is valid
        """
        required_fields = {
            'raffle_id': int,
            'user_id': int,
            'ticket_ids': list,
            'purchase_amount': (int, float),
            'transaction_id': str
        }
        
        return all(
            isinstance(data.get(field), field_type)
            for field, field_type in required_fields.items()
        )

    def _validate_ticket_reveal_data(self, data: Dict[str, Any]) -> bool:
        """
        Validate ticket reveal event data
        
        Args:
            data: Event data payload
            
        Returns:
            bool: True if data is valid
        """
        required_fields = {
            'raffle_id': int,
            'user_id': int,
            'ticket_id': str,
            'reveal_sequence': int,
            'reveal_time': str
        }
        
        return all(
            isinstance(data.get(field), field_type)
            for field, field_type in required_fields.items()
        )

    def _validate_prize_win_data(self, data: Dict[str, Any]) -> bool:
        """
        Validate prize win event data
        
        Args:
            data: Event data payload
            
        Returns:
            bool: True if data is valid
        """
        required_fields = {
            'raffle_id': int,
            'user_id': int,
            'ticket_id': str,
            'prize_instance_id': str,
            'prize_type': str,
            'prize_value': (int, float)
        }
        
        return all(
            isinstance(data.get(field), field_type)
            for field, field_type in required_fields.items()
        )

    def get_validation_stats(self) -> Dict[str, Any]:
        """
        Get validation statistics for monitoring
        
        Returns:
            Dict[str, Any]: Validation statistics and metrics
        """
        return {
            'registered_validators': {
                event_type.value: len(validators)
                for event_type, validators in self.custom_validators.items()
            },
            'supported_event_types': [
                event_type.value for event_type in EventType
                if event_type in self.custom_validators
            ],
            'version': '1.0',
            'last_updated': datetime.now(timezone.utc).isoformat()
        }

class EventDataModel(BaseModel):
    """
    Base model for event data validation
    
    Provides Pydantic model for strict type checking and
    validation of event data structures.
    """
    
    event_id: str = Field(..., description="Unique event identifier")
    timestamp: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        description="Event timestamp"
    )
    version: str = Field(default="1.0", description="Event version")
    
    @validator('event_id')
    def validate_event_id(cls, v: str) -> str:
        """Validate event ID format"""
        if not v or len(v) < 8:
            raise ValueError("Event ID must be at least 8 characters")
        return v

    @validator('timestamp')
    def validate_timestamp(cls, v: datetime) -> datetime:
        """Validate timestamp is not in future"""
        if v > datetime.now(timezone.utc):
            raise ValueError("Timestamp cannot be in the future")
        return v

    class Config:
        """Pydantic model configuration"""
        arbitrary_types_allowed = True
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }