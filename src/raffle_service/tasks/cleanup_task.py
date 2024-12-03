# src/raffle_service/tasks/cleanup_task.py

from datetime import datetime, timezone
import schedule
import time
import logging
from flask import current_app
from src.shared import db
from src.raffle_service.models import (
    Ticket, 
    TicketStatus,
    TicketReservation, 
    ReservationStatus
)
from src.raffle_service.services.reservation_service import ReservationService

# Configure logging
logger = logging.getLogger(__name__)

def cleanup_expired_reservations():
    """Periodic task to cleanup expired reservations"""
    logger.info("Starting cleanup of expired reservations")
    try:
        expired_reservations = TicketReservation.query.filter(
            TicketReservation.status == ReservationStatus.PENDING,
            TicketReservation.expires_at <= datetime.now(timezone.utc)
        ).all()

        for reservation in expired_reservations:
            # Let the ReservationService handle the cleanup
            ReservationService.handle_expired_reservation(reservation)
            logger.info(f"Cleaned up expired reservation {reservation.id}")

        db.session.commit()
        logger.info(f"Completed cleanup of {len(expired_reservations)} expired reservations")
        
    except Exception as e:
        logger.error(f"Error in cleanup task: {str(e)}")
        db.session.rollback()

def start_cleanup_scheduler():
    """Start the cleanup scheduler"""
    # Run every minute
    schedule.every(1).minutes.do(cleanup_expired_reservations)
    
    while True:
        schedule.run_pending()
        time.sleep(60)