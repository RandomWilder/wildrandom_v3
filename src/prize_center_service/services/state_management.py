# src/prize_center_service/services/state_management.py

from datetime import datetime, timezone
from typing import Optional, Dict, Any
from dataclasses import dataclass
import logging
from sqlalchemy.exc import SQLAlchemyError
from src.shared import db
from src.prize_center_service.models import PrizeInstance, InstanceStatus

logger = logging.getLogger(__name__)

@dataclass
class StateTransitionResult:
    """Data class for state transition results"""
    success: bool
    error_message: Optional[str] = None
    instance: Optional[PrizeInstance] = None
    metadata: Optional[Dict[str, Any]] = None

class PrizeStateManager:
    """
    Manages prize instance state transitions with atomic operations and validation.
    
    This class ensures proper state transitions with complete data integrity,
    validation, and rollback capabilities.
    """

    @staticmethod
    def update_discovery_state(
        instance: PrizeInstance,
        ticket_id: str
    ) -> StateTransitionResult:
        """
        Update instance state for prize discovery with atomic transaction.
        
        Args:
            instance: Prize instance to update
            ticket_id: ID of discovering ticket
            
        Returns:
            StateTransitionResult: Result of state transition attempt
        """
        try:
            if not ticket_id:
                return StateTransitionResult(
                    success=False,
                    error_message="Ticket ID required for discovery"
                )

            current_time = datetime.now(timezone.utc)
            
            # Prepare state update data
            state_data = {
                'status': InstanceStatus.DISCOVERED,
                'discovering_ticket_id': ticket_id,
                'discovery_time': current_time,
                'metadata': {
                    'discovered_by_ticket': ticket_id,
                    'discovery_time': current_time.isoformat(),
                    'discovery_audit': {
                        'previous_status': instance.status,
                        'transition_time': current_time.isoformat()
                    }
                }
            }

            # Atomic update
            for key, value in state_data.items():
                setattr(instance, key, value)

            db.session.commit()
            logger.info(
                f"Prize {instance.instance_id} discovered by ticket {ticket_id}"
            )

            return StateTransitionResult(
                success=True,
                instance=instance,
                metadata=state_data
            )

        except SQLAlchemyError as e:
            db.session.rollback()
            error_msg = f"Database error in discovery state update: {str(e)}"
            logger.error(error_msg)
            return StateTransitionResult(
                success=False,
                error_message=error_msg
            )
        except Exception as e:
            db.session.rollback()
            error_msg = f"Unexpected error in discovery state update: {str(e)}"
            logger.error(error_msg, exc_info=True)
            return StateTransitionResult(
                success=False,
                error_message=error_msg
            )

    @staticmethod
    def validate_state_transition(
        instance: PrizeInstance,
        target_state: InstanceStatus,
        context: Dict[str, Any]
    ) -> Optional[str]:
        """
        Validate state transition with context awareness.
        
        Args:
            instance: Prize instance to validate
            target_state: Intended target state
            context: Additional validation context
            
        Returns:
            Optional[str]: Error message if validation fails
        """
        logger.debug(f"Validating state transition for prize {instance.instance_id}")
        logger.debug(f"Current state: {instance.status}")
        logger.debug(f"Target state: {target_state}")
        logger.debug(f"Context: {context}")

        if target_state == InstanceStatus.DISCOVERED:
            if not context.get('ticket_id'):
                return "Ticket ID required for discovery state"
                
        elif target_state == InstanceStatus.CLAIMED:
            if not instance.discovering_ticket_id:
                return "Missing discovery information"
            if not context.get('user_id'):
                return "User ID required for claim state"

        return None