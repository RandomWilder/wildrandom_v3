# src/prize_center_service/models/prize_states.py

"""
Prize State Management Module

Provides comprehensive state management for prize instances, including state definitions,
validation rules, and business logic for state transitions. Implements proper audit trails
and ownership validation.
"""

from enum import Enum
from typing import Optional, Dict, Any, Union, Set, FrozenSet
from dataclasses import dataclass
from datetime import datetime, timezone, timedelta
import logging

logger = logging.getLogger(__name__)

class StateValidationError(Exception):
    """Custom exception for state validation failures"""
    pass

class InstanceStatus(str, Enum):
    """
    Prize instance status states with business rules.
    
    Attributes:
        AVAILABLE: Initial state, prize can be discovered
        DISCOVERED: Prize found through instant win, pending claim
        CLAIMED: Successfully claimed by eligible user
        EXPIRED: No longer claimable due to time limit
        VOIDED: Administratively invalidated
    """
    AVAILABLE = "AVAILABLE"
    DISCOVERED = "DISCOVERED"
    CLAIMED = "CLAIMED"
    EXPIRED = "EXPIRED"
    VOIDED = "VOIDED"

    def __str__(self) -> str:
        """String representation matching database enum"""
        return self.value

    @classmethod
    def from_str(cls, value: str) -> 'InstanceStatus':
        """
        Convert string to InstanceStatus safely
        
        Args:
            value: Status string to convert
            
        Returns:
            InstanceStatus: Corresponding enum value
            
        Raises:
            ValueError: If status string is invalid
        """
        try:
            return cls(value)
        except ValueError:
            raise ValueError(f"'{value}' is not a valid {cls.__name__}")

@dataclass(frozen=True)
class PrizeStateConfig:
    """
    Configuration for prize instance state transitions and validations.
    
    Defines valid state transitions, validation rules, and business logic
    for prize instance lifecycle management.
    """
    
    DISCOVERY_EXPIRY_HOURS: int = 24

    # Valid states for operations
    CLAIMABLE_STATES: FrozenSet[str] = frozenset({
        InstanceStatus.DISCOVERED.value
    })
    
    DISCOVERABLE_STATES: FrozenSet[str] = frozenset({
        InstanceStatus.AVAILABLE.value
    })
    
    VOIDABLE_STATES: FrozenSet[str] = frozenset({
        InstanceStatus.AVAILABLE.value,
        InstanceStatus.DISCOVERED.value
    })

    def is_claimable(self, status: Union[str, InstanceStatus]) -> bool:
        """
        Check if instance is in a claimable state.
        
        Args:
            status: Current status (string or InstanceStatus)
            
        Returns:
            bool: True if status is claimable
        """
        if isinstance(status, InstanceStatus):
            status = status.value
        return status in self.CLAIMABLE_STATES

    def validate_claim_eligibility(
        self,
        discovery_time: datetime,
        ticket_owner_id: Optional[int],
        claiming_user_id: int
    ) -> Optional[str]:
        """
        Validate if a discovered prize can be claimed.
        
        Args:
            discovery_time: When prize was discovered
            ticket_owner_id: ID of user owning discovering ticket
            claiming_user_id: ID of user attempting to claim
            
        Returns:
            Optional[str]: Error message if validation fails, None if valid
        """
        # Validate discovery hasn't expired
        if (datetime.now(timezone.utc) - discovery_time) > timedelta(hours=self.DISCOVERY_EXPIRY_HOURS):
            return "Prize discovery has expired"

        # Validate ownership
        if ticket_owner_id != claiming_user_id:
            return "Not authorized to claim this prize"

        return None

    def is_discoverable(self, status: Union[str, InstanceStatus]) -> bool:
        """Check if instance is in a discoverable state"""
        if isinstance(status, InstanceStatus):
            status = status.value
        return status in self.DISCOVERABLE_STATES

    def is_voidable(self, status: Union[str, InstanceStatus]) -> bool:
        """Check if instance can be voided"""
        if isinstance(status, InstanceStatus):
            status = status.value
        return status in self.VOIDABLE_STATES

# Global state configuration instance
prize_states = PrizeStateConfig()