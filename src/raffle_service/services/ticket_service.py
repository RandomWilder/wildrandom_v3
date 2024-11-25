from typing import Optional, Tuple, List, Dict, Any
from datetime import datetime, timezone
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy import and_, func, case, or_
from flask import current_app
from src.shared import db
from src.raffle_service.models import (
    Ticket, TicketStatus, 
    Raffle, RaffleStatus,
    RaffleState
)
import logging

logger = logging.getLogger(__name__)

class TicketService:
    @staticmethod
    def get_user_tickets(user_id: int, raffle_id: Optional[int] = None) -> Tuple[Optional[List[Ticket]], Optional[str]]:
        """Get all tickets owned by a user, optionally filtered by raffle"""
        try:
            query = Ticket.query.filter_by(user_id=user_id)
            if raffle_id:
                query = query.filter_by(raffle_id=raffle_id)
            
            tickets = query.order_by(Ticket.purchase_time.desc()).all()
            return tickets, None

        except SQLAlchemyError as e:
            logger.error(f"Database error in get_user_tickets: {str(e)}")
            return None, str(e)

    @staticmethod
    def get_ticket_by_number(raffle_id: int, ticket_number: str) -> Tuple[Optional[Ticket], Optional[str]]:
        """Get specific ticket by its number"""
        try:
            ticket = Ticket.query.filter_by(
                raffle_id=raffle_id,
                ticket_number=ticket_number
            ).first()
            
            if not ticket:
                return None, "Ticket not found"
                
            return ticket, None

        except SQLAlchemyError as e:
            logger.error(f"Database error in get_ticket_by_number: {str(e)}")
            return None, str(e)

    @staticmethod
    def get_available_tickets(raffle_id: int, quantity: int) -> Tuple[Optional[List[Ticket]], Optional[str]]:
        """Get random available tickets for purchase"""
        try:
            tickets = Ticket.query.filter(
                Ticket.raffle_id == raffle_id,
                Ticket.status == TicketStatus.AVAILABLE.value
            ).order_by(func.random()).limit(quantity).all()

            if len(tickets) < quantity:
                return None, f"Only {len(tickets)} tickets available"

            return tickets, None

        except SQLAlchemyError as e:
            logger.error(f"Database error in get_available_tickets: {str(e)}")
            return None, str(e)

    @staticmethod
    def reserve_tickets(raffle_id: int, user_id: int, quantity: int) -> Tuple[Optional[List[Ticket]], Optional[str]]:
        """Reserve tickets for purchase"""
        try:
            # Verify raffle is open for sales
            raffle = Raffle.query.get(raffle_id)
            if not raffle or raffle.status != RaffleStatus.ACTIVE.value:
                return None, "Raffle is not active"
            if raffle.state != RaffleState.OPEN.value:
                return None, "Raffle is not open for purchases"

            # Get available tickets
            tickets, error = TicketService.get_available_tickets(raffle_id, quantity)
            if error:
                return None, error

            # Reserve tickets
            for ticket in tickets:
                if not ticket.reserve(user_id):
                    db.session.rollback()
                    return None, "Failed to reserve tickets"

            db.session.commit()
            return tickets, None

        except SQLAlchemyError as e:
            db.session.rollback()
            logger.error(f"Database error in reserve_tickets: {str(e)}")
            return None, str(e)

    @staticmethod
    def purchase_tickets(user_id: int, raffle_id: int, quantity: int, transaction_id: int) -> Tuple[Optional[List[Ticket]], Optional[str]]:
        """Complete ticket purchase"""
        try:
            # Get reserved or available tickets
            tickets = Ticket.query.filter(
                and_(
                    Ticket.raffle_id == raffle_id,
                    Ticket.status.in_([TicketStatus.RESERVED.value, TicketStatus.AVAILABLE.value]),
                    or_(
                        Ticket.user_id == user_id,
                        Ticket.user_id.is_(None)
                    )
                )
            ).limit(quantity).with_for_update().all()

            if len(tickets) < quantity:
                return None, "Not enough tickets available"

            # Complete purchase
            for ticket in tickets:
                if not ticket.purchase(transaction_id):
                    db.session.rollback()
                    return None, "Failed to purchase tickets"

            db.session.commit()
            return tickets, None

        except SQLAlchemyError as e:
            db.session.rollback()
            logger.error(f"Database error in purchase_tickets: {str(e)}")
            return None, str(e)

    @staticmethod
    def reveal_tickets(user_id: int, ticket_ids: List[str]) -> Tuple[Optional[List[Ticket]], Optional[str]]:
        """Reveal multiple tickets"""
        try:
            # Get tickets and verify ownership
            tickets = Ticket.query.filter(
                Ticket.ticket_id.in_(ticket_ids),
                Ticket.user_id == user_id,
                Ticket.status == TicketStatus.SOLD.value,
                Ticket.is_revealed == False
            ).order_by(Ticket.ticket_number).with_for_update().all()

            if not tickets:
                return None, "No eligible tickets found"

            # Get current highest reveal sequence
            max_sequence = db.session.query(func.max(Ticket.reveal_sequence))\
                .filter(Ticket.raffle_id == tickets[0].raffle_id)\
                .scalar() or 0

            revealed_tickets = []
            for i, ticket in enumerate(tickets, start=1):
                if ticket.reveal():
                    ticket.reveal_sequence = max_sequence + i
                    revealed_tickets.append(ticket)

            db.session.commit()
            return revealed_tickets, None

        except SQLAlchemyError as e:
            db.session.rollback()
            logger.error(f"Database error in reveal_tickets: {str(e)}")
            return None, str(e)

    @staticmethod
    def void_ticket(ticket_id: int, admin_id: int, reason: str) -> Tuple[Optional[Ticket], Optional[str]]:
        """Void a ticket (admin only)"""
        try:
            ticket = Ticket.query.get(ticket_id)
            if not ticket:
                return None, "Ticket not found"

            if not ticket.void(reason):
                return None, "Cannot void ticket"

            db.session.commit()
            return ticket, None

        except SQLAlchemyError as e:
            db.session.rollback()
            logger.error(f"Database error in void_ticket: {str(e)}")
            return None, str(e)

    @staticmethod
    def get_raffle_statistics(raffle_id: int) -> Tuple[Optional[Dict[str, Any]], Optional[str]]:
        """Get ticket statistics for a raffle"""
        try:
            stats = {
                'total_tickets': 0,
                'available_tickets': 0,
                'sold_tickets': 0,
                'revealed_tickets': 0,
                'eligible_tickets': 0,
                'instant_wins_discovered': 0,
                'unique_participants': 0
            }

            # Get basic stats
            results = db.session.query(
                func.count(Ticket.id).label('total'),
                func.sum(case((Ticket.status == TicketStatus.AVAILABLE.value, 1), else_=0)).label('available'),
                func.sum(case((Ticket.status == TicketStatus.SOLD.value, 1), else_=0)).label('sold'),
                func.sum(case((Ticket.is_revealed == True, 1), else_=0)).label('revealed'),
                func.sum(case((Ticket.instant_win_eligible == True, 1), else_=0)).label('eligible')
            ).filter(Ticket.raffle_id == raffle_id).first()

            if results:
                stats.update({
                    'total_tickets': results.total or 0,
                    'available_tickets': results.available or 0,
                    'sold_tickets': results.sold or 0,
                    'revealed_tickets': results.revealed or 0,
                    'eligible_tickets': results.eligible or 0
                })

            # Get unique participants
            unique_users = db.session.query(func.count(func.distinct(Ticket.user_id)))\
                .filter(
                    Ticket.raffle_id == raffle_id,
                    Ticket.user_id.isnot(None)
                ).scalar()
            stats['unique_participants'] = unique_users or 0

            return stats, None

        except SQLAlchemyError as e:
            logger.error(f"Database error in get_raffle_statistics: {str(e)}")
            return None, str(e)
        
    @staticmethod
    def get_tickets_by_filters(raffle_id: int, filters: dict, limit: Optional[int] = None) -> Tuple[Optional[List[Ticket]], Optional[str]]:
        """Get tickets by filters"""
        try:
            # Start with base query
            query = Ticket.query.filter_by(raffle_id=raffle_id)
            
            # Apply filters
            if filters.get('status'):
                query = query.filter_by(status=filters['status'])
            if filters.get('user_id') is not None:
                query = query.filter_by(user_id=filters['user_id'])
            if filters.get('revealed') is not None:
                query = query.filter_by(is_revealed=filters['revealed'])
            if filters.get('instant_win_eligible') is not None:
                query = query.filter_by(instant_win_eligible=filters['instant_win_eligible'])
                
            # Apply ordering first
            query = query.order_by(Ticket.ticket_number)
                
            # Then apply limit if specified
            if limit:
                query = query.limit(limit)
                
            # Execute query and return results
            tickets = query.all()
            return tickets, None
            
        except SQLAlchemyError as e:
            logger.error(f"Database error in get_tickets_by_filters: {str(e)}")
            return None, str(e)