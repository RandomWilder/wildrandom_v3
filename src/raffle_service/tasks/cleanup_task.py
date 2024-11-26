from datetime import datetime, timezone
import schedule
import time
from src.raffle_service.services.reservation_service import ReservationService
import logging

logger = logging.getLogger(__name__)

def cleanup_expired_reservations():
    """Periodic task to cleanup expired reservations"""
    logger.info("Starting cleanup of expired reservations")
    ReservationService.cleanup_expired_reservations()
    logger.info("Completed cleanup of expired reservations")

def start_cleanup_scheduler():
    """Start the cleanup scheduler"""
    # Run every minute
    schedule.every(1).minutes.do(cleanup_expired_reservations)
    
    while True:
        schedule.run_pending()
        time.sleep(60)