from typing import Optional, Tuple, List, Dict
from datetime import datetime, timezone
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy import func, and_, not_
from src.shared import db
from src.raffle_service.models import (
    Ticket, TicketStatus,
    Raffle, RaffleStatus, RaffleState,
    RaffleDraw, DrawResult
)
from src.prize_center_service.models import EnhancedPrizePool as PrizePool
import logging

logger = logging.getLogger(__name__)

class DrawService:
    @staticmethod
    def execute_draw(raffle_id: int, admin_id: int) -> Tuple[Optional[RaffleDraw], Optional[str]]:
        """Execute a single prize draw for a raffle"""
        try:
            # Verify raffle state
            raffle = Raffle.query.get(raffle_id)
            if not raffle:
                return None, "Raffle not found"
                
            if raffle.state != RaffleState.ENDED.value:
                return None, "Raffle must be ended to execute draw"

            # Get prize pool to check remaining draw_win instances
            prize_pool = PrizePool.query.get(raffle.prize_pool_id)
            if not prize_pool:
                return None, "Prize pool not found"

            # Check if we've already done all draws
            existing_draws = RaffleDraw.query.filter_by(raffle_id=raffle_id).count()
            if existing_draws >= prize_pool.draw_win_count:
                return None, "All draws have been completed"

            # Get all eligible tickets (excluding previous winners)
            previous_winners = db.session.query(RaffleDraw.ticket_id).filter_by(raffle_id=raffle_id)
            eligible_tickets = Ticket.query.filter(
                Ticket.raffle_id == raffle_id,
                not_(Ticket.id.in_(previous_winners))
            ).all()
            
            if not eligible_tickets:
                return None, "No eligible tickets for draw"

            # Randomly select winner
            winning_ticket = DrawService._select_random_winner(eligible_tickets)
            if not winning_ticket:
                return None, "Failed to select winner"

            # Create draw record
            draw = RaffleDraw(
                raffle_id=raffle_id,
                ticket_id=winning_ticket.id,
                draw_sequence=existing_draws + 1,
                prize_instance_id=prize_pool.get_next_draw_instance().id
            )
            
            db.session.add(draw)
            db.session.flush()  # Get draw ID
            
            # Calculate result based on ticket ownership
            draw.calculate_result()
            
            # Process draw results
            draw.process_draw()
            
            db.session.commit()
            return draw, None
            
        except SQLAlchemyError as e:
            db.session.rollback()
            logger.error(f"Database error in execute_draw: {str(e)}")
            return None, str(e)

    @staticmethod
    def execute_multiple_draws(raffle_id: int, admin_id: int, number_of_draws: int) -> Tuple[Optional[List[RaffleDraw]], Optional[str]]:
        """Execute multiple prize draws for a raffle"""
        try:
            draws = []
            for _ in range(number_of_draws):
                draw, error = DrawService.execute_draw(raffle_id, admin_id)
                if error:
                    if "All draws have been completed" in error:
                        break
                    return None, error
                draws.append(draw)
            
            return draws, None
            
        except SQLAlchemyError as e:
            db.session.rollback()
            logger.error(f"Database error in execute_multiple_draws: {str(e)}")
            return None, str(e)

    @staticmethod
    def _select_random_winner(tickets: List[Ticket]) -> Optional[Ticket]:
        """Randomly select a winning ticket"""
        if not tickets:
            return None
            
        random_index = int(func.random() * len(tickets))
        return tickets[random_index]

    @staticmethod
    def get_raffle_winners(raffle_id: int) -> Tuple[Optional[List[Dict]], Optional[str]]:
        """Get all winners for a raffle"""
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
                        'instance_id': draw.prize_instance_id,
                        'type': draw.prize_instance.instance_type,
                        'status': draw.prize_instance.status
                    } if draw.prize_instance else None
                })
                winners.append(winner_info)

            return winners, None

        except SQLAlchemyError as e:
            logger.error(f"Database error in get_raffle_winners: {str(e)}")
            return None, str(e)

    @staticmethod
    def get_user_wins(user_id: int) -> Tuple[Optional[List[Dict]], Optional[str]]:
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
                        'instance_id': draw.prize_instance_id,
                        'type': draw.prize_instance.instance_type,
                        'status': draw.prize_instance.status
                    } if draw.prize_instance else None
                })
                user_wins.append(win_info)

            return user_wins, None

        except SQLAlchemyError as e:
            logger.error(f"Database error in get_user_wins: {str(e)}")
            return None, str(e)

    @staticmethod
    def verify_draw_result(draw_id: int) -> Tuple[Optional[bool], Optional[str]]:
        """Verify a draw result is valid"""
        try:
            draw = RaffleDraw.query.get(draw_id)
            if not draw:
                return None, "Draw not found"

            # Verify draw sequence
            sequence_valid = RaffleDraw.query.filter(
                RaffleDraw.raffle_id == draw.raffle_id,
                RaffleDraw.draw_sequence < draw.draw_sequence
            ).count() == draw.draw_sequence - 1

            # Verify ticket wasn't drawn before
            ticket_unique = RaffleDraw.query.filter(
                RaffleDraw.raffle_id == draw.raffle_id,
                RaffleDraw.ticket_id == draw.ticket_id,
                RaffleDraw.id != draw.id
            ).count() == 0

            # Verify result matches ticket ownership
            result_valid = (
                (draw.result == DrawResult.WINNER.value and draw.ticket.user_id is not None) or
                (draw.result == DrawResult.NO_WINNER.value and draw.ticket.user_id is None)
            )

            return all([sequence_valid, ticket_unique, result_valid]), None

        except SQLAlchemyError as e:
            logger.error(f"Database error in verify_draw_result: {str(e)}")
            return None, str(e)