from typing import Optional, Tuple, List, Dict, Any
from datetime import datetime, timezone, timedelta
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy import and_, or_, func, case
import logging
from src.shared import db
from src.raffle_service.models import (
    Raffle, RaffleStatus, RaffleState,
    Ticket, TicketStatus,
    RaffleHistory
)
from src.prize_center_service.models import EnhancedPrizePool as PrizePool, PoolStatus

logger = logging.getLogger(__name__)

class RaffleService:
    @staticmethod
    def create_raffle(data: dict, admin_id: int) -> Tuple[Optional[Dict], Optional[str]]:
        """Create a new raffle"""
        try:
            # Validate prize pool
            prize_pool = PrizePool.query.get(data['prize_pool_id'])
            if not prize_pool:
                return None, "Prize pool not found"
            if prize_pool.status.value != 'locked':
                return None, "Prize pool must be locked"

            # Create raffle
            raffle = Raffle(
            title=data['title'],
            description=data.get('description'),
            prize_pool_id=prize_pool.id,
            total_tickets=data['total_tickets'],
            ticket_price=data['ticket_price'],
            max_tickets_per_user=data['max_tickets_per_user'],
            start_time=data['start_time'],
            end_time=data['end_time'],
            status=RaffleStatus.INACTIVE.value,
            state=RaffleState.DRAFT.value,
            created_by_id=admin_id
            )
            
            db.session.add(raffle)
            db.session.flush()  # Get raffle ID

            # Generate tickets
            tickets_created = RaffleService._generate_tickets(
            raffle_id=raffle.id,
            total_tickets=raffle.total_tickets,
            instant_win_count=prize_pool.instant_win_instances
        )
            
            if not tickets_created:
                db.session.rollback()
                return None, "Failed to generate tickets"

            db.session.commit()
            return raffle.to_dict(), None

        except SQLAlchemyError as e:
            db.session.rollback()
            logger.error(f"Database error in create_raffle: {str(e)}")
            return None, str(e)

    @staticmethod
    def _generate_tickets(raffle_id: int, total_tickets: int, instant_win_count: int = 0) -> bool:
        """Generate tickets for raffle with instant win assignment"""
        try:
            # Generate all tickets first
            tickets = []
            for i in range(total_tickets):
                ticket_number = f"{i+1:03d}"  # Format: 001, 002, etc.
                ticket = Ticket(
                    raffle_id=raffle_id,
                    ticket_number=ticket_number,
                    status=TicketStatus.AVAILABLE.value,
                    instant_win_eligible=False
                )
                tickets.append(ticket)
            
            db.session.bulk_save_objects(tickets)
            db.session.flush()

            if instant_win_count > 0:
                # Select random tickets for instant win eligibility
                eligible_tickets = Ticket.query.filter_by(
                    raffle_id=raffle_id,
                    status=TicketStatus.AVAILABLE.value
                ).order_by(func.random()).limit(instant_win_count).all()

                for ticket in eligible_tickets:
                    ticket.instant_win_eligible = True

            db.session.commit()
            return True

        except SQLAlchemyError as e:
            db.session.rollback()
            logger.error(f"Error generating tickets: {str(e)}")
            return False

    @staticmethod
    def get_raffle(raffle_id: int) -> Tuple[Optional[Raffle], Optional[str]]:
        """Get raffle by ID with optimized loading"""
        try:
            logger.debug(f"Attempting to retrieve raffle with ID: {raffle_id}")
            
            # Use simpler eager loading just for prize pool
            raffle = Raffle.query.options(
                db.joinedload(Raffle.prize_pool)
            ).get(raffle_id)
            
            if not raffle:
                logger.info(f"Raffle {raffle_id} not found")
                return None, "Raffle not found"
                
            # Load prize pool instances separately if needed
            if raffle.prize_pool:
                db.session.refresh(raffle.prize_pool)
                
            logger.debug(f"Found raffle {raffle_id}, updating state")
                
            try:
                # Update state based on current time
                raffle.update_state()
                db.session.commit()
                logger.debug(f"Successfully updated raffle {raffle_id} state to {raffle.state}")
                    
            except SQLAlchemyError as state_error:
                logger.error(f"Error updating raffle state: {str(state_error)}")
                db.session.rollback()
                # Continue even if state update fails - we still want to return the raffle
                    
            return raffle, None
                
        except SQLAlchemyError as e:
            logger.error(f"Database error in get_raffle: {str(e)}", exc_info=True)
            return None, f"Database error: {str(e)}"
        except Exception as e:
            logger.error(f"Unexpected error in get_raffle: {str(e)}", exc_info=True)
            return None, f"Unexpected error: {str(e)}"

    @staticmethod
    def list_visible_raffles() -> Tuple[Optional[List[Raffle]], Optional[str]]:
        """Get all raffles visible in UI"""
        try:
            three_days_ago = datetime.now(timezone.utc) - timedelta(days=3)
            
            raffles = Raffle.query.filter(
                or_(
                    Raffle.status == RaffleStatus.ACTIVE.value,
                    and_(
                        Raffle.status == RaffleStatus.INACTIVE.value,
                        Raffle.state == RaffleState.COMING_SOON.value
                    ),
                    and_(
                        Raffle.state == RaffleState.ENDED.value,
                        Raffle.end_time >= three_days_ago
                    )
                )
            ).all()

            # Update states based on current time
            for raffle in raffles:
                raffle.update_state()

            return raffles, None

        except SQLAlchemyError as e:
            logger.error(f"Database error in list_visible_raffles: {str(e)}")
            return None, str(e)

    @staticmethod
    def update_raffle(raffle_id: int, data: dict, admin_id: int) -> Tuple[Optional[Raffle], Optional[str]]:
        """Update raffle details"""
        try:
            raffle = Raffle.query.get(raffle_id)
            if not raffle:
                return None, "Raffle not found"

            if raffle.state not in [RaffleState.DRAFT.value, RaffleState.COMING_SOON.value]:
                return None, "Can only update draft or coming soon raffles"

            # Update allowed fields
            updatable_fields = [
                'title', 'description', 'ticket_price',
                'max_tickets_per_user', 'start_time', 'end_time'
            ]

            for field in updatable_fields:
                if field in data:
                    setattr(raffle, field, data[field])

            raffle.update_state()
            db.session.commit()

            return raffle, None

        except SQLAlchemyError as e:
            db.session.rollback()
            logger.error(f"Database error in update_raffle: {str(e)}")
            return None, str(e)

    @staticmethod
    def update_raffle_status(raffle_id: int, new_status: RaffleStatus, admin_id: int) -> Tuple[Optional[Raffle], Optional[str]]:
        """Update raffle status"""
        try:
            raffle = Raffle.query.get(raffle_id)
            if not raffle:
                return None, "Raffle not found"

            if new_status == RaffleStatus.ACTIVE:
                success, error = raffle.activate()
            elif new_status == RaffleStatus.INACTIVE:
                success, error = raffle.deactivate()
            elif new_status == RaffleStatus.CANCELLED:
                success, error = raffle.cancel()
            else:
                return None, f"Invalid status: {new_status}"

            if not success:
                return None, error

            db.session.commit()
            return raffle, None

        except SQLAlchemyError as e:
            db.session.rollback()
            logger.error(f"Database error in update_raffle_status: {str(e)}")
            return None, str(e)

    @staticmethod
    def get_raffle_stats(raffle_id: int) -> Tuple[Optional[Dict], Optional[str]]:
        """Get raffle statistics"""
        try:
            raffle = Raffle.query.get(raffle_id)
            if not raffle:
                return None, "Raffle not found"

            # Get ticket statistics
            stats = db.session.query(
                func.count(Ticket.id),
                func.sum(case((Ticket.status == TicketStatus.SOLD.value, 1), else_=0)),
                func.sum(case((Ticket.instant_win_eligible == True, 1), else_=0)),
                func.sum(case((Ticket.is_revealed == True, 1), else_=0))
            ).filter(Ticket.raffle_id == raffle_id).first()

            total_tickets, sold_tickets, eligible_tickets, revealed_tickets = stats

            return {
                'total_tickets': total_tickets or 0,
                'sold_tickets': sold_tickets or 0,
                'available_tickets': total_tickets - (sold_tickets or 0),
                'instant_win_eligible': eligible_tickets or 0,
                'revealed_tickets': revealed_tickets or 0,
                'total_value': float(raffle.ticket_price * (sold_tickets or 0))
            }, None

        except SQLAlchemyError as e:
            logger.error(f"Database error in get_raffle_stats: {str(e)}")
            return None, str(e)