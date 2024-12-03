# src/prize_center_service/services/instance_service.py

"""
Prize Instance Management Service

This module provides comprehensive management of prize instances throughout their lifecycle,
including discovery, claiming, and state transitions. Implements business logic for both
instant-win and draw-win prize types with proper error handling and audit trails.
"""

from typing import Optional, Tuple, List, Dict
from datetime import datetime, timezone
import random
import logging
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy import func, and_
from src.shared import db

from .state_management import PrizeStateManager

# Prize Center Models and States
from src.prize_center_service.models.prize_states import (
    InstanceStatus,
    prize_states
)
from src.prize_center_service.models import (
    PrizeInstance,
    InstantWinInstance,
    DrawWinInstance
)

# Related Service Models
from src.raffle_service.models import Ticket, TicketStatus, Raffle
from src.payment_service.models import Transaction
from src.payment_service.services import PaymentService

# Configure logging
logger = logging.getLogger(__name__)

class InstanceService:
    """
    Service class for managing prize instances throughout their lifecycle.
    Handles instance creation, status management, discovery, and claiming.
    
    Attributes:
        None - Stateless service class using static methods
        
    Note:
        This service implements the business logic layer for prize instance management,
        ensuring proper state transitions and maintaining data consistency.
    """

    @staticmethod
    def get_instance(instance_id: str) -> Tuple[Optional[PrizeInstance], Optional[str]]:
        """
        Retrieve a specific prize instance by ID.

        Args:
            instance_id (str): Unique identifier of the prize instance

        Returns:
            Tuple[Optional[PrizeInstance], Optional[str]]: Instance and error message if any
        """
        try:
            instance = PrizeInstance.query.filter_by(instance_id=instance_id).first()
            if not instance:
                return None, "Instance not found"
            return instance, None
            
        except SQLAlchemyError as e:
            logger.error(f"Database error in get_instance: {str(e)}")
            return None, str(e)

    @staticmethod
    def get_pool_instances(
        pool_id: int, 
        type: Optional[str] = None
    ) -> Tuple[Optional[List[PrizeInstance]], Optional[str]]:
        """
        Get all instances for a specific prize pool.

        Args:
            pool_id (int): ID of the prize pool
            type (Optional[str]): Filter by instance type (instant_win/draw_win)

        Returns:
            Tuple[Optional[List[PrizeInstance]], Optional[str]]: List of instances and error message if any
        """
        try:
            query = PrizeInstance.query.filter_by(pool_id=pool_id)
            
            if type == 'instant_win':
                query = query.with_polymorphic(InstantWinInstance)
            elif type == 'draw_win':
                query = query.with_polymorphic(DrawWinInstance)
                
            instances = query.all()
            return instances, None
            
        except SQLAlchemyError as e:
            logger.error(f"Database error in get_pool_instances: {str(e)}")
            return None, str(e)

    @staticmethod
    def discover_instant_win(pool_id: int, ticket_id: str) -> Tuple[Optional[InstantWinInstance], Optional[str]]:
        """Discover an instant win prize using weighted random selection"""
        try:
            logger.info(f"Starting prize discovery for pool {pool_id}, ticket {ticket_id}")
            
            # Get available instances with explicit locking
            available_instances = InstantWinInstance.query.filter(
                InstantWinInstance.pool_id == pool_id,
                InstantWinInstance.status == InstanceStatus.AVAILABLE.value
            ).with_for_update().all()

            logger.info(f"Found {len(available_instances)} available instances")

            if not available_instances:
                return None, "No prizes available"

            # Calculate odds
            total_odds = sum(instance.individual_odds for instance in available_instances)
            logger.info(f"Total odds calculation: {total_odds}")
            
            if total_odds <= 0:
                return None, None

            # Select prize
            roll = random.uniform(0, total_odds)
            current_sum = 0

            for instance in available_instances:
                current_sum += instance.individual_odds
                if roll <= current_sum:
                    # Update state using state manager
                    instance.status = InstanceStatus.DISCOVERED.value
                    instance.discovering_ticket_id = ticket_id
                    instance.discovery_time = datetime.now(timezone.utc)
                    
                    logger.info(f"Selected prize instance: {instance.instance_id}")
                    db.session.commit()
                    return instance, None

            logger.info("No prize selected from roll")
            return None, None

        except SQLAlchemyError as e:
            db.session.rollback()
            logger.error(f"Database error in discover_instant_win: {str(e)}", exc_info=True)
            return None, f"Database error: {str(e)}"
        except Exception as e:
            db.session.rollback()
            logger.error(f"Unexpected error in discover_instant_win: {str(e)}", exc_info=True)
            return None, f"Unexpected error: {str(e)}"

    @staticmethod
    def _get_status_value(status) -> str:
        """
        Helper method to safely get string value from status
        
        Args:
            status: Either string or InstanceStatus enum
            
        Returns:
            str: The actual status value
        """
        if isinstance(status, InstanceStatus):
            return status.value
        return str(status)

    @staticmethod
    def validate_claim_eligibility(
        instance: PrizeInstance,
        user_id: int
    ) -> Optional[str]:
        """
        Validate if user can claim prize instance.
        
        Args:
            instance: Prize instance to validate
            user_id: ID of user attempting claim
            
        Returns:
            Optional[str]: Error message if validation fails, None if valid
        """
        logger.debug(f"Validating claim eligibility for prize {instance.instance_id}")
        logger.debug(f"User ID: {user_id}")
        logger.debug(f"Current status: {instance.status}")
        logger.debug(f"Discovering ticket: {instance.discovering_ticket_id}")

        # State validation
        if instance.status != InstanceStatus.DISCOVERED:
            logger.warning(f"Invalid prize state for claim: {instance.status}")
            return f"Prize must be in DISCOVERED state to claim. Current state: {instance.status}"

        if not instance.discovering_ticket_id:
            logger.error(f"No discovery information found for prize {instance.instance_id}")
            return "No discovery information found"

        try:
            # Find the discovering ticket with ownership verification
            ticket = Ticket.query.filter(
                and_(
                    Ticket.ticket_id == instance.discovering_ticket_id,
                    Ticket.user_id == user_id,
                    Ticket.status == TicketStatus.REVEALED.value
                )
            ).first()

            if not ticket:
                logger.warning(
                    f"Ticket ownership verification failed - "
                    f"User: {user_id}, Ticket: {instance.discovering_ticket_id}"
                )
                return "Not authorized to claim this prize"

            logger.info(
                f"Claim eligibility validated - "
                f"Prize: {instance.instance_id}, User: {user_id}, "
                f"Ticket: {ticket.ticket_id}"
            )
            return None

        except SQLAlchemyError as e:
            logger.error(f"Database error in validate_claim_eligibility: {str(e)}")
            return "Error validating claim eligibility"

    @staticmethod
    def claim_prize(
        instance_id: str,
        user_id: int,
        value_type: str = 'credit'
    ) -> Tuple[Optional[PrizeInstance], Optional[Transaction], Optional[str]]:
        """
        Process a complete prize claim with payment integration.
        
        Args:
            instance_id: Unique identifier of prize instance
            user_id: ID of claiming user
            value_type: Type of value to claim (credit/cash/retail)
            
        Returns:
            Tuple containing:
                - Updated prize instance if successful
                - Created transaction if successful
                - Error message if unsuccessful
        """
        if value_type != 'credit':
            return None, None, f"Value type '{value_type}' not supported"

        try:
            # Get prize instance with lock
            instance = db.session.query(PrizeInstance).with_for_update().filter_by(
                instance_id=instance_id
            ).first()

            if not instance:
                logger.error(f"Prize instance not found: {instance_id}")
                return None, None, "Prize instance not found"

            # Validate claim eligibility
            error = InstanceService.validate_claim_eligibility(instance, user_id)
            if error:
                return None, None, f"Failed to claim prize: {error}"

            try:
                # Process payment
                claim_value = instance.credit_value
                logger.info(
                    f"Processing credit claim - "
                    f"Amount: {claim_value}, User: {user_id}, "
                    f"Prize: {instance_id}"
                )

                transaction, error = PaymentService.process_prize_claim(
                    user_id=user_id,
                    prize_instance_id=instance_id,
                    credit_amount=claim_value
                )

                if error:
                    logger.error(f"Payment processing failed: {error}")
                    return None, None, f"Failed to process credit: {error}"

                # Update instance status and metadata
                instance.status = InstanceStatus.CLAIMED.value
                instance.claimed_at = datetime.now(timezone.utc)
                instance.claimed_by_id = user_id
                instance.claim_meta = instance.claim_meta or {}
                instance.claim_meta.update({
                    'claim_details': {
                        'value_type': value_type,
                        'claimed_at': instance.claimed_at.isoformat(),
                        'transaction_id': transaction.id,
                        'amount': float(claim_value)
                    }
                })

                db.session.commit()
                logger.info(
                    f"Prize {instance_id} successfully claimed by user {user_id}"
                )

                return instance, transaction, None

            except Exception as e:
                db.session.rollback()
                logger.error(f"Error processing claim: {str(e)}")
                return None, None, f"Claim processing failed: {str(e)}"

        except SQLAlchemyError as e:
            db.session.rollback()
            logger.error(f"Database error in claim_prize: {str(e)}")
            return None, None, f"Database error: {str(e)}"