from typing import Optional, Tuple, Dict, List
from datetime import datetime, timezone, timedelta
from sqlalchemy.exc import SQLAlchemyError
from src.shared import db
from src.raffle_service.models import (
    Raffle, RaffleStatus, RaffleState,
    RaffleHistory
)
import logging

logger = logging.getLogger(__name__)

class StateService:
    # Valid status transitions mapping
    STATUS_TRANSITIONS = {
        RaffleStatus.INACTIVE.value: [RaffleStatus.ACTIVE.value, RaffleStatus.CANCELLED.value],
        RaffleStatus.ACTIVE.value: [RaffleStatus.INACTIVE.value],
        RaffleStatus.CANCELLED.value: []  # Terminal status, no transitions allowed
    }

    @staticmethod
    def update_status(raffle_id: int, new_status: str, admin_id: int, reason: str = None) -> Tuple[Optional[Raffle], Optional[str]]:
        """Update raffle status with validation and history tracking"""
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

            # Validate status transition
            if new_status == 'active':
                if raffle.status == 'active':
                    return raffle, "Raffle is already active"
                raffle.status = 'active'
            elif new_status == 'inactive':
                if raffle.status == 'inactive':
                    return raffle, "Raffle is already inactive"
                raffle.status = 'inactive'
            else:
                return None, "Invalid status"
            
            # Ensure timezone-aware comparison
            current_time = datetime.now(timezone.utc)
            start_time = raffle.start_time.replace(tzinfo=timezone.utc) if raffle.start_time.tzinfo is None else raffle.start_time
            end_time = raffle.end_time.replace(tzinfo=timezone.utc) if raffle.end_time.tzinfo is None else raffle.end_time
            
            # Recalculate state based on new status
            if current_time >= end_time:
                new_state = 'ended'
            elif current_time >= start_time:
                new_state = 'open'
            else:
                new_state = 'coming_soon'
            
            logger.debug(f"New state calculation: Current time: {current_time}, Start: {start_time}, End: {end_time}, New state: {new_state}")
            
            raffle.state = new_state

            # Create history record
            history = RaffleHistory(
                raffle_id=raffle.id,
                previous_status=previous_status,
                new_status=new_status,
                previous_state=previous_state,
                new_state=new_state,
                changed_by_id=admin_id,
                reason=reason or f"Status changed to {new_status}"
            )
            
            db.session.add(history)
            db.session.commit()
            
            logger.info(f"Successfully updated raffle {raffle_id} to status {new_status}, state {new_state}")
            return raffle, None

        except Exception as e:
            logger.error(f"Error in update_status: {str(e)}", exc_info=True)
            db.session.rollback()
            return None, str(e)

    @staticmethod
    def handle_time_based_transitions() -> Tuple[Optional[List[Dict]], Optional[str]]:
        """Handle automatic time-based state transitions"""
        try:
            current_time = datetime.now(timezone.utc)
            transitions = []

            # Find raffles that need state updates
            raffles = Raffle.query.filter(
                db.or_(
                    # Coming soon -> Open
                    db.and_(
                        Raffle.status == RaffleStatus.ACTIVE.value,
                        Raffle.state == RaffleState.COMING_SOON.value,
                        Raffle.start_time <= current_time
                    ),
                    # Open -> Ended
                    db.and_(
                        Raffle.status == RaffleStatus.ACTIVE.value,
                        Raffle.state == RaffleState.OPEN.value,
                        Raffle.end_time <= current_time
                    ),
                    # Auto-deactivate after 3 days
                    db.and_(
                        Raffle.status == RaffleStatus.ACTIVE.value,
                        Raffle.end_time <= current_time - timedelta(days=3)
                    )
                )
            ).all()

            for raffle in raffles:
                previous_status = raffle.status
                previous_state = raffle.state

                # Handle 3-day auto-deactivation
                if (raffle.end_time <= current_time - timedelta(days=3) and 
                    raffle.status == RaffleStatus.ACTIVE.value):
                    raffle.status = RaffleStatus.INACTIVE.value

                # Update state based on current time
                new_state = raffle.calculate_state()
                if new_state.value != raffle.state:
                    raffle.state = new_state.value

                    # Create history record
                    history = RaffleHistory(
                        raffle_id=raffle.id,
                        previous_status=previous_status,
                        new_status=raffle.status,
                        previous_state=previous_state,
                        new_state=new_state.value,
                        reason="Automatic time-based transition"
                    )
                    db.session.add(history)

                    transitions.append({
                        'raffle_id': raffle.id,
                        'previous_status': previous_status,
                        'new_status': raffle.status,
                        'previous_state': previous_state,
                        'new_state': new_state.value,
                        'transition_time': current_time.isoformat()
                    })

            db.session.commit()
            return transitions, None

        except SQLAlchemyError as e:
            db.session.rollback()
            logger.error(f"Database error in handle_time_based_transitions: {str(e)}")
            return None, str(e)

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