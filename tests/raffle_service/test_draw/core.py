"""Core functionality for raffle draw testing"""

from datetime import datetime, timezone, timedelta
from typing import List, Tuple, Optional
from decimal import Decimal
import logging

from src.shared import db
from src.raffle_service.models import (
    Raffle, RaffleStatus, RaffleState,
    Ticket, TicketStatus,
    RaffleDraw, DrawResult
)
from src.prize_center_service.models import (
    PrizePool, PoolStatus,
    PrizeTemplate, PrizeType,
    DrawWinInstance
)

logger = logging.getLogger(__name__)

class RaffleDrawTester:
    """Complete raffle draw testing suite"""
    
    def __init__(self, admin_id: int):
        self.admin_id = admin_id
        self.raffle_id: Optional[int] = None
        self.pool_id: Optional[int] = None
        self.tickets: List[Ticket] = []
        
    def setup_test_environment(self) -> Tuple[bool, Optional[str]]:
        """Setup complete test environment including prize pool and raffle"""
        try:
            # 1. Create prize pool
            pool = PrizePool(
                name=f"Test Pool {datetime.now(timezone.utc).timestamp()}",
                status=PoolStatus.LOCKED.value,
                total_instances=1,
                draw_win_instances=1,
                created_by_id=self.admin_id
            )
            db.session.add(pool)
            db.session.flush()
            self.pool_id = pool.id
            
            # 2. Create draw win prize template
            template = PrizeTemplate(
                name="Test Draw Prize",
                type=PrizeType.DRAW_WIN,
                retail_value=Decimal('100.00'),
                cash_value=Decimal('100.00'),
                credit_value=Decimal('100.00'),
                created_by_id=self.admin_id
            )
            db.session.add(template)
            db.session.flush()
            
            # 3. Create draw win instance
            instance = DrawWinInstance(
                instance_id=f"{pool.id}-{template.id}-001",
                pool_id=pool.id,
                template_id=template.id,
                retail_value=template.retail_value,
                cash_value=template.cash_value,
                credit_value=template.credit_value,
                created_by_id=self.admin_id
            )
            db.session.add(instance)
            
            # 4. Create ended raffle
            raffle = Raffle(
                title=f"Test Raffle {datetime.now(timezone.utc).timestamp()}",
                prize_pool_id=pool.id,
                total_tickets=10,
                ticket_price=Decimal('10.00'),
                max_tickets_per_user=5,
                start_time=datetime.now(timezone.utc) - timedelta(hours=2),
                end_time=datetime.now(timezone.utc) - timedelta(hours=1),
                status=RaffleStatus.ACTIVE.value,
                state=RaffleState.ENDED.value,
                created_by_id=self.admin_id
            )
            db.session.add(raffle)
            db.session.flush()
            self.raffle_id = raffle.id
            
            # 5. Create test tickets
            for i in range(10):
                ticket = Ticket(
                    raffle_id=raffle.id,
                    ticket_number=f"{i+1:03d}",
                    status=TicketStatus.REVEALED.value,
                    is_revealed=True,
                    reveal_time=datetime.now(timezone.utc)
                )
                self.tickets.append(ticket)
                db.session.add(ticket)
            
            db.session.commit()
            logger.info(f"Test environment created - Raffle ID: {self.raffle_id}")
            return True, None
            
        except Exception as e:
            db.session.rollback()
            logger.error(f"Failed to setup test environment: {str(e)}")
            return False, str(e)
    
    def execute_draw(self) -> Tuple[bool, Optional[str]]:
        """Execute draw and verify results"""
        try:
            from src.raffle_service.services import DrawService
            
            # Execute draw
            draw, error = DrawService.execute_draw(self.raffle_id, self.admin_id)
            if error:
                return False, f"Draw execution failed: {error}"
            
            if not draw:
                return False, "No draw result returned"
            
            # Verify draw record
            logger.info(f"Draw executed - ID: {draw.id}")
            logger.info(f"Selected ticket: {draw.ticket_id}")
            logger.info(f"Draw sequence: {draw.draw_sequence}")
            logger.info(f"Result: {draw.result}")
            
            # Verify ticket selection
            selected_ticket = Ticket.query.get(draw.ticket_id)
            if not selected_ticket:
                return False, "Selected ticket not found"
                
            logger.info(f"Selected ticket number: {selected_ticket.ticket_number}")
            
            return True, None
            
        except Exception as e:
            logger.error(f"Draw test failed: {str(e)}")
            return False, str(e)
    
    def verify_draw_results(self) -> Tuple[bool, Optional[str]]:
        """Verify draw results are properly recorded"""
        try:
            # Check draw record exists
            draw = RaffleDraw.query.filter_by(raffle_id=self.raffle_id).first()
            if not draw:
                return False, "No draw record found"
            
            # Verify draw data
            checks = {
                "Has draw sequence": draw.draw_sequence is not None,
                "Has ticket ID": draw.ticket_id is not None,
                "Has prize instance": draw.prize_instance_id is not None,
                "Has result": draw.result in [r.value for r in DrawResult],
                "Has drawn timestamp": draw.drawn_at is not None
            }
            
            failed_checks = [k for k, v in checks.items() if not v]
            if failed_checks:
                return False, f"Failed checks: {', '.join(failed_checks)}"
            
            logger.info("Draw result verification passed")
            logger.info(f"Draw data: {draw.to_dict()}")
            
            return True, None
            
        except Exception as e:
            logger.error(f"Result verification failed: {str(e)}")
            return False, str(e)
    
    def cleanup(self):
        """Clean up test data"""
        try:
            if self.raffle_id:
                db.session.query(RaffleDraw).filter_by(raffle_id=self.raffle_id).delete()
                db.session.query(Ticket).filter_by(raffle_id=self.raffle_id).delete()
                db.session.query(Raffle).filter_by(id=self.raffle_id).delete()
            
            if self.pool_id:
                db.session.query(DrawWinInstance).filter_by(pool_id=self.pool_id).delete()
                db.session.query(PrizePool).filter_by(id=self.pool_id).delete()
            
            db.session.commit()
            logger.info("Test cleanup completed")
            
        except Exception as e:
            db.session.rollback()
            logger.error(f"Cleanup failed: {str(e)}")