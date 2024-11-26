from typing import Optional, Tuple, List, Dict
from datetime import datetime, timezone, timedelta
from sqlalchemy.exc import SQLAlchemyError
from src.shared import db
from src.raffle_service.models import (
    Ticket, TicketStatus,
    Raffle, RaffleStatus, RaffleState,
    TicketReservation, ReservationStatus
)
import logging

logger = logging.getLogger(__name__)

class ReservationService:
    RESERVATION_TIMEOUT_MINUTES = 5

    @staticmethod
    def create_reservation(
        user_id: int,
        raffle_id: int,
        quantity: int
    ) -> Tuple[Optional[TicketReservation], Optional[str]]:
        """Create new ticket reservation"""
        try:
            # Verify raffle status
            raffle = Raffle.query.get(raffle_id)
            if not raffle or raffle.status != RaffleStatus.ACTIVE.value:
                return None, "Raffle is not active"
            if raffle.state != RaffleState.OPEN.value:
                return None, "Raffle is not open for purchases"

            # Get available tickets
            available_tickets = Ticket.query.filter(
                Ticket.raffle_id == raffle_id,
                Ticket.status == TicketStatus.AVAILABLE.value
            ).order_by(db.func.random()).limit(quantity).all()

            if len(available_tickets) < quantity:
                return None, f"Only {len(available_tickets)} tickets available"

            # Calculate total amount
            total_amount = raffle.ticket_price * quantity

            # Create reservation
            ticket_ids = [ticket.ticket_id for ticket in available_tickets]
            reservation = TicketReservation(
                user_id=user_id,
                raffle_id=raffle_id,
                ticket_ids=ticket_ids,
                total_amount=total_amount,
                expires_at=datetime.now(timezone.utc) + timedelta(minutes=ReservationService.RESERVATION_TIMEOUT_MINUTES)
            )
            db.session.add(reservation)

            # Mark tickets as reserved
            for ticket in available_tickets:
                ticket.status = TicketStatus.RESERVED.value
                ticket.user_id = user_id

            db.session.commit()
            return reservation, None

        except SQLAlchemyError as e:
            db.session.rollback()
            logger.error(f"Database error in create_reservation: {str(e)}")
            return None, str(e)

    @staticmethod
    def get_reservation(
        reservation_id: int,
        user_id: int
    ) -> Tuple[Optional[TicketReservation], Optional[str]]:
        """Get reservation by ID"""
        try:
            reservation = TicketReservation.query.filter_by(
                id=reservation_id,
                user_id=user_id
            ).first()

            if not reservation:
                return None, "Reservation not found"

            # Ensure proper timezone handling for expiry check
            now = datetime.now(timezone.utc)
            expires_at = reservation.expires_at.replace(tzinfo=timezone.utc) if reservation.expires_at.tzinfo is None else reservation.expires_at

            if now > expires_at and reservation.status == ReservationStatus.PENDING:
                ReservationService.handle_expired_reservation(reservation)
                return None, "Reservation has expired"

            return reservation, None

        except SQLAlchemyError as e:
            logger.error(f"Database error in get_reservation: {str(e)}")
            return None, str(e)

    @staticmethod
    def create_reservation(
        user_id: int,
        raffle_id: int,
        quantity: int
    ) -> Tuple[Optional[TicketReservation], Optional[str]]:
        """Create new ticket reservation"""
        try:
            # Verify raffle status
            raffle = Raffle.query.get(raffle_id)
            if not raffle or raffle.status != RaffleStatus.ACTIVE.value:
                return None, "Raffle is not active"
            if raffle.state != RaffleState.OPEN.value:
                return None, "Raffle is not open for purchases"

            # Get available tickets
            available_tickets = Ticket.query.filter(
                Ticket.raffle_id == raffle_id,
                Ticket.status == TicketStatus.AVAILABLE.value
            ).order_by(db.func.random()).limit(quantity).all()

            if len(available_tickets) < quantity:
                return None, f"Only {len(available_tickets)} tickets available"

            # Calculate total amount
            total_amount = raffle.ticket_price * quantity

            # Get ticket IDs for reservation
            ticket_ids = [ticket.ticket_id for ticket in available_tickets]

            # Create reservation with explicit UTC timezone
            expiry_time = datetime.now(timezone.utc) + timedelta(minutes=ReservationService.RESERVATION_TIMEOUT_MINUTES)
            reservation = TicketReservation(
                user_id=user_id,
                raffle_id=raffle_id,
                ticket_ids=ticket_ids,
                total_amount=total_amount,
                expires_at=expiry_time  # This will now be UTC
            )
            db.session.add(reservation)

            # Mark tickets as reserved
            for ticket in available_tickets:
                ticket.status = TicketStatus.RESERVED.value
                ticket.user_id = user_id

            db.session.commit()
            return reservation, None

        except SQLAlchemyError as e:
            db.session.rollback()
            logger.error(f"Database error in create_reservation: {str(e)}")
            return None, str(e)

    @staticmethod
    def handle_expired_reservation(reservation: TicketReservation) -> None:
        """Handle expired reservation"""
        try:
            # Mark tickets as available again
            Ticket.query.filter(
                Ticket.ticket_id.in_(reservation.ticket_ids)
            ).update({
                'status': TicketStatus.AVAILABLE.value,
                'user_id': None
            }, synchronize_session=False)

            # Mark reservation as expired
            reservation.expire()
            
            db.session.commit()

        except SQLAlchemyError as e:
            db.session.rollback()
            logger.error(f"Error handling expired reservation: {str(e)}")

    @staticmethod
    def cleanup_expired_reservations() -> None:
        """Cleanup all expired reservations"""
        try:
            expired_reservations = TicketReservation.query.filter(
                TicketReservation.status == ReservationStatus.PENDING,
                TicketReservation.expires_at <= datetime.now(timezone.utc)
            ).all()

            for reservation in expired_reservations:
                ReservationService.handle_expired_reservation(reservation)

        except SQLAlchemyError as e:
            logger.error(f"Error cleaning up reservations: {str(e)}")

    @staticmethod
    def cancel_reservation(
        reservation_id: int,
        user_id: int
    ) -> Tuple[bool, Optional[str]]:
        """Cancel a pending reservation"""
        try:
            reservation = TicketReservation.query.filter_by(
                id=reservation_id,
                user_id=user_id,
                status=ReservationStatus.PENDING
            ).first()

            if not reservation:
                return False, "No pending reservation found"

            # Release the tickets
            Ticket.query.filter(
                Ticket.ticket_id.in_(reservation.ticket_ids)
            ).update({
                'status': TicketStatus.AVAILABLE.value,
                'user_id': None
            }, synchronize_session=False)

            # Cancel the reservation
            reservation.status = ReservationStatus.CANCELLED
            db.session.commit()

            return True, None

        except SQLAlchemyError as e:
            db.session.rollback()
            logger.error(f"Database error in cancel_reservation: {str(e)}")
            return False, str(e)