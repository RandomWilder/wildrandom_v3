"""
Draw Service Module

Handles raffle draw execution and winner selection with comprehensive state management
and prize pool integration. Implements both immediate and scheduled draw capabilities
while maintaining data consistency and proper error handling.
"""

from typing import Optional, Tuple, List, Dict, Any
from datetime import datetime, timezone, timedelta
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy import func, and_, not_
import random
from src.shared import db
from src.raffle_service.models import (
    Raffle, RaffleStatus, RaffleState,
    RaffleDraw, DrawResult, Ticket, TicketStatus
)
from src.prize_center_service.models import (
    PrizeInstance, PrizePool, DrawWinInstance
)
from src.taskscheduler_service import task_service, TaskType
import logging
from functools import wraps

logger = logging.getLogger(__name__)

def validate_raffle_state(func):
    """Decorator to validate raffle state before draw execution"""
    @wraps(func)
    def wrapper(*args, **kwargs):
        raffle_id = kwargs.get('raffle_id')
        raffle = Raffle.query.get(raffle_id)
        
        if not raffle:
            logger.error(f"Raffle {raffle_id} not found")
            return None, "Raffle not found"
            
        if raffle.state != RaffleState.ENDED.value:
            logger.error(f"Invalid raffle state for draw: {raffle.state}")
            return None, f"Raffle must be in ENDED state (current: {raffle.state})"
        
        return func(*args, **kwargs)
    return wrapper

class DrawService:
    """Service for managing raffle draws with automated prize pool integration"""

    @staticmethod
    @validate_raffle_state
    def execute_raffle_draws(raffle_id: int, admin_id: Optional[int] = None) -> Tuple[Optional[List[RaffleDraw]], Optional[str]]:
        """
        Execute all draws for a raffle based on prize pool configuration.
        
        Args:
            raffle_id: ID of raffle to process draws for
            admin_id: Optional ID of admin executing draws
            
        Returns:
            Tuple containing list of draws and optional error message
        """
        try:
            logger.info(f"Starting draw execution for raffle {raffle_id}")
            
            raffle = Raffle.query.get(raffle_id)
            prize_pool = PrizePool.query.get(raffle.prize_pool_id)
            
            if not prize_pool:
                return None, "Prize pool not found"
            
            # Get available draw win instances
            available_instances = DrawWinInstance.query.filter_by(
                pool_id=prize_pool.id,
                status='available'
            ).all()
            
            if not available_instances:
                return None, "No draw win prizes available"
            
            logger.info(f"Found {len(available_instances)} available draw win prizes")
            
            # Get eligible tickets
            eligible_tickets = Ticket.query.filter_by(
                raffle_id=raffle_id,
                status=TicketStatus.REVEALED.value
            ).all()
            
            if not eligible_tickets:
                return None, "No eligible tickets for draw"
                
            logger.info(f"Found {len(eligible_tickets)} eligible tickets")
            
            draws = []
            previous_winners = set()  # Track previous winning tickets
            
            for i, instance in enumerate(available_instances, 1):
                # Select winning ticket
                remaining_tickets = [t for t in eligible_tickets if t.ticket_id not in previous_winners]
                if not remaining_tickets:
                    logger.warning("No more eligible tickets for remaining prizes")
                    break
                    
                winning_ticket = random.choice(remaining_tickets)
                logger.info(f"Selected winning ticket {winning_ticket.ticket_id} for draw {i}")
                
                # Create draw record
                draw = RaffleDraw(
                    raffle_id=raffle_id,
                    ticket_id=winning_ticket.ticket_id,  # Using string ticket_id instead of ID
                    draw_sequence=i,
                    prize_instance_id=instance.id,
                    result=DrawResult.WINNER.value if winning_ticket.user_id else DrawResult.NO_WINNER.value,
                    drawn_at=datetime.now(timezone.utc)
                )
                
                if draw.result == DrawResult.WINNER.value:
                    # Update instance state
                    instance.status = 'discovered'
                    instance.discovering_ticket_id = winning_ticket.ticket_id
                    instance.discovery_time = datetime.now(timezone.utc)
                    previous_winners.add(winning_ticket.ticket_id)
                
                db.session.add(draw)
                draws.append(draw)
                
                logger.info(
                    f"Draw {i} completed - "
                    f"Ticket: {winning_ticket.ticket_id}, "
                    f"Result: {draw.result}, "
                    f"Prize: {instance.instance_id}"
                )
            
            db.session.commit()
            logger.info(f"Successfully completed {len(draws)} draws")
            return draws, None
            
        except SQLAlchemyError as e:
            db.session.rollback()
            logger.error(f"Database error in draw execution: {str(e)}", exc_info=True)
            return None, f"Database error: {str(e)}"
        except Exception as e:
            db.session.rollback()
            logger.error(f"Error executing draws: {str(e)}", exc_info=True)
            return None, str(e)

    @staticmethod
    def get_raffle_winners(raffle_id: int) -> Tuple[Optional[List[Dict[str, Any]]], Optional[str]]:
        """Get all winners for a raffle with comprehensive details"""
        try:
            draws = RaffleDraw.query.filter_by(
                raffle_id=raffle_id,
                result=DrawResult.WINNER.value
            ).order_by(RaffleDraw.draw_sequence).all()
            
            winners = []
            for draw in draws:
                winner_info = draw.to_dict()
                winner_info.update({
                    'ticket_details': {
                        'number': draw.ticket.ticket_number,
                        'user_id': draw.ticket.user_id,
                        'reveal_time': draw.ticket.reveal_time.isoformat() if draw.ticket.reveal_time else None
                    },
                    'prize_details': {
                        'instance_id': draw.prize_instance.instance_id,
                        'type': draw.prize_instance.instance_type,
                        'status': draw.prize_instance.status,
                        'value': {
                            'retail': float(draw.prize_instance.retail_value),
                            'cash': float(draw.prize_instance.cash_value),
                            'credit': float(draw.prize_instance.credit_value)
                        }
                    } if draw.prize_instance else None
                })
                winners.append(winner_info)
            
            return winners, None
            
        except Exception as e:
            logger.error(f"Error getting raffle winners: {str(e)}", exc_info=True)
            return None, str(e)

    @staticmethod
    def get_user_wins(user_id: int) -> Tuple[Optional[List[Dict[str, Any]]], Optional[str]]:
        """Get all winning draws for a user"""
        try:
            draws = RaffleDraw.query.join(RaffleDraw.ticket).filter(
                RaffleDraw.result == DrawResult.WINNER.value,
                Ticket.user_id == user_id
            ).order_by(RaffleDraw.drawn_at.desc()).all()
            
            user_wins = []
            for draw in draws:
                win_info = draw.to_dict()
                win_info.update({
                    'raffle_details': {
                        'title': draw.raffle.title,
                        'end_time': draw.raffle.end_time.isoformat(),
                        'ticket_price': float(draw.raffle.ticket_price)
                    },
                    'prize_details': {
                        'instance_id': draw.prize_instance.instance_id,
                        'type': draw.prize_instance.instance_type,
                        'status': draw.prize_instance.status
                    } if draw.prize_instance else None
                })
                user_wins.append(win_info)
            
            return user_wins, None
            
        except Exception as e:
            logger.error(f"Error getting user wins: {str(e)}", exc_info=True)
            return None, str(e)

    @staticmethod
    def schedule_draw(raffle: Raffle) -> Tuple[bool, Optional[str]]:
        """Schedule draw execution for when raffle ends"""
        try:
            execution_time = raffle.end_time + timedelta(minutes=1)
            
            task_service.create_task({
                'task_type': TaskType.DRAW_EXECUTION.value,
                'target_id': raffle.id,
                'execution_time': execution_time,
                'params': {
                    'raffle_id': raffle.id,
                    'scheduled_at': datetime.now(timezone.utc).isoformat()
                }
            })
            
            logger.info(f"Draw scheduled for raffle {raffle.id} at {execution_time}")
            return True, None
            
        except Exception as e:
            logger.error(f"Failed to schedule draw for raffle {raffle.id}: {str(e)}")
            return False, str(e)