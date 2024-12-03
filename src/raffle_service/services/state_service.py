from typing import Optional, Tuple, Dict, List
from datetime import datetime, timezone, timedelta
from sqlalchemy.exc import SQLAlchemyError
from src.shared import db
from src.taskscheduler_service import task_service, TaskType
from src.raffle_service.models import (
    Raffle, RaffleStatus, RaffleState,
    RaffleHistory
)
import logging
from functools import wraps

logger = logging.getLogger(__name__)

def log_state_change(func):
    """Decorator to log state changes with detailed context"""
    @wraps(func)
    def wrapper(*args, **kwargs):
        logger.info(f"Starting state change operation: {func.__name__}")
        try:
            result = func(*args, **kwargs)
            logger.info(f"Completed state change operation: {func.__name__}")
            return result
        except Exception as e:
            logger.error(f"Failed state change operation: {func.__name__}", exc_info=True)
            raise
    return wrapper

class StateService:
    """
    Service for managing raffle state transitions and scheduling.
    
    Handles both manual and automated state transitions, maintaining
    consistency between status and state while providing comprehensive
    tracking and validation.
    """
    
    # Valid status transitions mapping
    STATUS_TRANSITIONS = {
        RaffleStatus.INACTIVE.value: [RaffleStatus.ACTIVE.value, RaffleStatus.CANCELLED.value],
        RaffleStatus.ACTIVE.value: [RaffleStatus.INACTIVE.value],
        RaffleStatus.CANCELLED.value: []  # Terminal status, no transitions allowed
    }

    @staticmethod
    @log_state_change
    def update_status(
        raffle_id: int,
        new_status: str,
        admin_id: int,
        reason: str = None
    ) -> Tuple[Optional[Raffle], Optional[str]]:
        """
        Update raffle status with validation and history tracking.
        Also schedules necessary state transitions when activated.
        """
        try:
            logger.debug(f"Attempting to update raffle {raffle_id} status to {new_status}")
            raffle = Raffle.query.get(raffle_id)
            if not raffle:
                logger.error(f"Raffle {raffle_id} not found")
                return None, "Raffle not found"

            logger.debug(f"Current raffle state - Status: {raffle.status}, State: {raffle.state}")

            # Store previous state for history
            previous_status = raffle.status
            previous_state = raffle.state

            # Validate and apply status change
            if new_status == RaffleStatus.ACTIVE.value:
                if raffle.status == RaffleStatus.ACTIVE.value:
                    return raffle, "Raffle is already active"
                # Schedule state transitions when activating
                StateService._schedule_state_transitions(raffle)
                raffle.status = RaffleStatus.ACTIVE.value
            elif new_status == RaffleStatus.INACTIVE.value:
                if raffle.status == RaffleStatus.INACTIVE.value:
                    return raffle, "Raffle is already inactive"
                raffle.status = RaffleStatus.INACTIVE.value
            else:
                return None, "Invalid status"
            
            # Recalculate state
            raffle.update_state()

            # Create history record
            history = RaffleHistory(
                raffle_id=raffle.id,
                previous_status=previous_status,
                new_status=new_status,
                previous_state=previous_state,
                new_state=raffle.state,
                changed_by_id=admin_id,
                reason=reason or f"Status changed to {new_status}"
            )
            
            db.session.add(history)
            db.session.commit()
            
            logger.info(f"Successfully updated raffle {raffle_id} to status {new_status}, state {raffle.state}")
            return raffle, None

        except Exception as e:
            logger.error(f"Error in update_status: {str(e)}", exc_info=True)
            db.session.rollback()
            return None, str(e)
        
    @staticmethod
    @log_state_change
    def update_state(
        raffle_id: int,
        new_state: str,
        admin_id: int,
        reason: str = None
    ) -> Tuple[Optional[Raffle], Optional[str]]:
        """
        Update raffle state with administrative validation and history tracking.
        
        Args:
            raffle_id: Target raffle identifier
            new_state: Desired state to transition to
            admin_id: Administrator performing the change
            reason: Administrative reason for audit trail
            
        Returns:
            Tuple[Optional[Raffle], Optional[str]]: Updated raffle or error message
            
        Business Rules:
        - Only specific state transitions are allowed
        - All transitions require audit trail
        - State consistency must be maintained
        """
        try:
            raffle = Raffle.query.get(raffle_id)
            if not raffle:
                logger.error(f"Raffle {raffle_id} not found")
                return None, "Raffle not found"

            logger.debug(f"Current state - State: {raffle.state}, Status: {raffle.status}")
            previous_state = raffle.state

            # State transition validation matrix
            valid_transitions = {
                RaffleState.DRAFT.value: [RaffleState.COMING_SOON.value],
                RaffleState.COMING_SOON.value: [RaffleState.OPEN.value],
                RaffleState.OPEN.value: [RaffleState.PAUSED.value, RaffleState.ENDED.value],
                RaffleState.PAUSED.value: [RaffleState.OPEN.value, RaffleState.ENDED.value]
            }

            # Validate transition
            if raffle.state not in valid_transitions or new_state not in valid_transitions.get(raffle.state, []):
                return None, f"Invalid state transition from {raffle.state} to {new_state}"

            # Update state
            raffle.state = new_state
            raffle.updated_at = datetime.now(timezone.utc)

            # Create history record
            history = RaffleHistory(
                raffle_id=raffle.id,
                previous_status=raffle.status,
                new_status=raffle.status,
                previous_state=previous_state,
                new_state=new_state,
                changed_by_id=admin_id,
                reason=reason or f"Administrative state change to {new_state}"
            )
            db.session.add(history)

            # Special handling for ENDED state
            if new_state == RaffleState.ENDED.value:
                from src.raffle_service.services import DrawService
                DrawService.schedule_draw(raffle)

            db.session.commit()
            logger.info(f"State updated for raffle {raffle_id}: {previous_state} -> {new_state}")
            return raffle, None

        except Exception as e:
            db.session.rollback()
            logger.error(f"State update failed: {str(e)}", exc_info=True)
            return None, str(e)

    @staticmethod
    def _schedule_state_transitions(raffle: Raffle) -> None:
        """Schedule all necessary state transitions for an active raffle"""
        try:
            logger.info(f"Scheduling state transitions for raffle {raffle.id}")
            
            # Schedule transition to OPEN state
            if raffle.state == RaffleState.COMING_SOON.value:
                task_service.create_task({
                    'task_type': TaskType.STATE_TRANSITION.value,
                    'target_id': raffle.id,
                    'execution_time': raffle.start_time,
                    'params': {
                        'from_state': RaffleState.COMING_SOON.value,
                        'to_state': RaffleState.OPEN.value,
                        'trigger_type': 'start_time'
                    }
                })
            
            # Schedule transition to ENDED state
            task_service.create_task({
                'task_type': TaskType.STATE_TRANSITION.value,
                'target_id': raffle.id,
                'execution_time': raffle.end_time,
                'params': {
                    'from_state': RaffleState.OPEN.value,
                    'to_state': RaffleState.ENDED.value,
                    'trigger_type': 'end_time'
                }
            })
            
            logger.info(f"State transitions scheduled for raffle {raffle.id}")
            
        except Exception as e:
            logger.error(f"Error scheduling state transitions: {str(e)}", exc_info=True)
            raise

    @staticmethod
    def handle_state_transition(task_params: dict) -> None:
        """
        Handle scheduled state transition execution.
        Called by TaskScheduler when transition time is reached.
        """
        raffle_id = task_params['target_id']
        from_state = task_params['params']['from_state']
        to_state = task_params['params']['to_state']
        
        logger.info(f"Executing state transition for raffle {raffle_id}: {from_state} -> {to_state}")
        
        try:
            raffle = Raffle.query.get(raffle_id)
            if not raffle:
                raise ValueError(f"Raffle {raffle_id} not found")
            
            # Validate transition is still valid
            if raffle.state != from_state:
                raise ValueError(f"Invalid state transition - current: {raffle.state}, expected: {from_state}")
            
            # Update state and create history record
            raffle.state = to_state
            raffle.updated_at = datetime.now(timezone.utc)
            
            history = RaffleHistory(
                raffle_id=raffle.id,
                previous_status=raffle.status,
                new_status=raffle.status,
                previous_state=from_state,
                new_state=to_state,
                reason=f"Scheduled transition to {to_state}"
            )
            db.session.add(history)
            
            # Special handling for ENDED state
            if to_state == RaffleState.ENDED.value:
                from src.raffle_service.services import DrawService
                DrawService.schedule_draw(raffle)
            
            db.session.commit()
            logger.info(f"State transition completed for raffle {raffle_id}")
            
        except Exception as e:
            db.session.rollback()
            logger.error(f"State transition failed for raffle {raffle_id}: {str(e)}")
            raise

    @staticmethod
    def get_state_history(raffle_id: int) -> Tuple[Optional[List[Dict]], Optional[str]]:
        """Get complete state/status change history for a raffle"""
        try:
            history = RaffleHistory.query.filter_by(
                raffle_id=raffle_id
            ).order_by(RaffleHistory.created_at.desc()).all()

            return [record.to_dict() for record in history], None

        except SQLAlchemyError as e:
            logger.error(f"Database error in get_state_history: {str(e)}")
            return None, str(e)

    @staticmethod
    def validate_state(raffle_id: int) -> Tuple[bool, Optional[str]]:
        """Validate current state consistency"""
        try:
            raffle = Raffle.query.get(raffle_id)
            if not raffle:
                return False, "Raffle not found"

            # Calculate expected state
            expected_state = raffle.calculate_state()

            # Check if current state matches expected
            if raffle.state != expected_state.value:
                logger.warning(
                    f"State mismatch for raffle {raffle_id}. "
                    f"Current: {raffle.state}, Expected: {expected_state.value}"
                )
                return False, "State mismatch detected"

            return True, None

        except SQLAlchemyError as e:
            logger.error(f"Database error in validate_state: {str(e)}")
            return False, str(e)

    @staticmethod
    def cleanup_invalid_states() -> Tuple[int, Optional[str]]:
        """
        Cleanup and correct invalid states.
        Returns count of corrected states and any error message.
        """
        try:
            corrected = 0
            current_time = datetime.now(timezone.utc)
            
            raffles = Raffle.query.filter(
                Raffle.status == RaffleStatus.ACTIVE.value
            ).all()
            
            for raffle in raffles:
                expected_state = raffle.calculate_state()
                if raffle.state != expected_state.value:
                    previous_state = raffle.state
                    raffle.state = expected_state.value
                    
                    history = RaffleHistory(
                        raffle_id=raffle.id,
                        previous_status=raffle.status,
                        new_status=raffle.status,
                        previous_state=previous_state,
                        new_state=expected_state.value,
                        reason="Automatic state correction"
                    )
                    db.session.add(history)
                    corrected += 1
            
            if corrected > 0:
                db.session.commit()
                logger.info(f"Corrected {corrected} invalid states")
            
            return corrected, None
            
        except SQLAlchemyError as e:
            db.session.rollback()
            logger.error(f"Database error in cleanup_invalid_states: {str(e)}")
            return 0, str(e)