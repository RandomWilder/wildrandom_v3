"""Simple utility to check raffle draw results"""

import os
import sys
import logging
from datetime import datetime, timezone

from app import create_app
from src.shared import db
from src.raffle_service.models import RaffleDraw, Ticket, Raffle
from src.prize_center_service.models import PrizeInstance

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)

def check_draw_results(raffle_id: int):
    """Check draw results for specific raffle"""
    app = create_app()
    
    with app.app_context():
        try:
            # Get draw records
            draws = RaffleDraw.query.filter_by(raffle_id=raffle_id).all()
            
            if not draws:
                logging.info(f"No draws found for raffle {raffle_id}")
                return
            
            logging.info(f"\nFound {len(draws)} draws for raffle {raffle_id}")
            
            for draw in draws:
                logging.info("\nDraw Details:")
                logging.info(f"Draw ID: {draw.id}")
                logging.info(f"Sequence: {draw.draw_sequence}")
                logging.info(f"Result: {draw.result}")
                logging.info(f"Drawn at: {draw.drawn_at}")
                
                # Get selected ticket details
                ticket = Ticket.query.get(draw.ticket_id)
                if ticket:
                    logging.info("\nSelected Ticket:")
                    logging.info(f"Ticket ID: {ticket.ticket_id}")
                    logging.info(f"Ticket Number: {ticket.ticket_number}")
                    logging.info(f"User ID: {ticket.user_id}")
                    logging.info(f"Status: {ticket.status}")
                
                # Get prize instance details
                prize = PrizeInstance.query.get(draw.prize_instance_id)
                if prize:
                    logging.info("\nPrize Details:")
                    logging.info(f"Instance ID: {prize.instance_id}")
                    logging.info(f"Status: {prize.status}")
                    logging.info(f"Type: {prize.instance_type}")
                    
        except Exception as e:
            logging.error(f"Error checking draw results: {str(e)}")

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python check_raffle_draw.py <raffle_id>")
        sys.exit(1)
        
    raffle_id = int(sys.argv[1])
    check_draw_results(raffle_id)
    