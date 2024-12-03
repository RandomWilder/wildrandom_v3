"""
Raffle Analysis Tool

Provides comprehensive analysis of raffle performance metrics including:
- Basic raffle information and timing
- Ticket sales performance
- Prize distribution statistics
- Winner analysis
"""

from datetime import datetime, timezone
import logging
from typing import Dict, List, Optional
from dataclasses import dataclass
from tabulate import tabulate

from app import create_app
from src.shared import db
from src.raffle_service.models import Raffle, Ticket, TicketStatus, RaffleDraw
from src.prize_center_service.models import (
    PrizeInstance,
    InstanceStatus,
    InstantWinInstance
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@dataclass
class RaffleMetrics:
    """Container for raffle performance metrics"""
    raffle_id: int
    title: str
    start_time: datetime
    end_time: datetime
    total_tickets: int
    tickets_sold: int
    tickets_revealed: int
    winning_ticket: Optional[str]
    instant_wins: Dict[str, int]  # Status counts for instant wins
    
    def calculate_fill_rate(self) -> float:
        """Calculate ticket fill rate percentage"""
        return (self.tickets_sold / self.total_tickets * 100) if self.total_tickets > 0 else 0
    
    def format_time(self, dt: datetime) -> str:
        """Format datetime for display"""
        return dt.strftime('%Y-%m-%d %H:%M:%S')

class RaffleAnalyzer:
    """Analyzes raffle performance and prize distribution"""
    
    def __init__(self):
        """Initialize analyzer with database connection"""
        self.app = create_app()
        self.db = db
        
    def get_ticket_stats(self, raffle_id: int) -> Dict[str, int]:
        """Get ticket statistics for raffle"""
        with self.app.app_context():
            return {
                'total': db.session.query(Ticket).filter_by(
                    raffle_id=raffle_id
                ).count(),
                'sold': db.session.query(Ticket).filter_by(
                    raffle_id=raffle_id,
                    status=TicketStatus.SOLD.value
                ).count(),
                'revealed': db.session.query(Ticket).filter_by(
                    raffle_id=raffle_id,
                    status=TicketStatus.REVEALED.value
                ).count()
            }
    
    def get_winning_ticket(self, raffle_id: int) -> Optional[str]:
        """Get winning ticket for raffle draw"""
        with self.app.app_context():
            draw = db.session.query(RaffleDraw).filter_by(
                raffle_id=raffle_id
            ).first()
            
            if draw:
                ticket = Ticket.query.get(draw.ticket_id)
                return ticket.ticket_id if ticket else None
            return None
    
    def get_instant_win_stats(self, raffle_id: int) -> Dict[str, int]:
        """Get instant win prize statistics"""
        with self.app.app_context():
            # Get prize pool ID for raffle
            raffle = Raffle.query.get(raffle_id)
            if not raffle or not raffle.prize_pool_id:
                return {}
            
            # Query instant win instances
            instances = db.session.query(InstantWinInstance).filter_by(
                pool_id=raffle.prize_pool_id
            ).all()
            
            # Count instances by status
            status_counts = {status.value: 0 for status in InstanceStatus}
            for instance in instances:
                status_counts[instance.status] += 1
                
            return {
                'revealed': status_counts[InstanceStatus.AVAILABLE.value],
                'discovered': status_counts[InstanceStatus.DISCOVERED.value],
                'claimed': status_counts[InstanceStatus.CLAIMED.value]
            }
    
    def analyze_raffle(self, raffle_id: int) -> Optional[RaffleMetrics]:
        """Analyze complete raffle performance"""
        with self.app.app_context():
            raffle = Raffle.query.get(raffle_id)
            if not raffle:
                logger.error(f"Raffle {raffle_id} not found")
                return None
            
            ticket_stats = self.get_ticket_stats(raffle_id)
            winning_ticket = self.get_winning_ticket(raffle_id)
            instant_wins = self.get_instant_win_stats(raffle_id)
            
            return RaffleMetrics(
                raffle_id=raffle.id,
                title=raffle.title,
                start_time=raffle.start_time,
                end_time=raffle.end_time,
                total_tickets=raffle.total_tickets,
                tickets_sold=ticket_stats['sold'],
                tickets_revealed=ticket_stats['revealed'],
                winning_ticket=winning_ticket,
                instant_wins=instant_wins
            )
    
    def analyze_all_raffles(self) -> List[RaffleMetrics]:
        """Analyze all raffles in system"""
        with self.app.app_context():
            raffle_ids = [r.id for r in Raffle.query.all()]
            return [
                metrics for metrics in [
                    self.analyze_raffle(raffle_id) 
                    for raffle_id in raffle_ids
                ] 
                if metrics is not None
            ]
    
    def print_analysis(self, metrics: List[RaffleMetrics]):
        """Print formatted analysis results"""
        headers = [
            "Raffle ID", "Title", "Period", 
            "Tickets (Sold/Total)", "Fill Rate",
            "Revealed", "Winning Ticket",
            "Instant Wins (R/D/C)"
        ]
        
        rows = []
        for m in metrics:
            # Format time period
            period = (
                f"{m.format_time(m.start_time)} - \n"
                f"{m.format_time(m.end_time)}"
            )
            
            # Format ticket stats
            tickets = f"{m.tickets_sold}/{m.total_tickets}"
            fill_rate = f"{m.calculate_fill_rate():.1f}%"
            
            # Format instant wins
            instant_wins = (
                f"{m.instant_wins.get('revealed', 0)}/"
                f"{m.instant_wins.get('discovered', 0)}/"
                f"{m.instant_wins.get('claimed', 0)}"
            )
            
            rows.append([
                m.raffle_id,
                m.title,
                period,
                tickets,
                fill_rate,
                m.tickets_revealed,
                m.winning_ticket or "N/A",
                instant_wins
            ])
        
        print("\nRaffle Analysis Report")
        print("=" * 100)
        print(tabulate(
            rows,
            headers=headers,
            tablefmt="grid",
            numalign="right",
            stralign="left"
        ))
        print("\nInstant Wins (R/D/C): Revealed/Discovered/Claimed")

def main():
    """Run raffle analysis"""
    try:
        analyzer = RaffleAnalyzer()
        metrics = analyzer.analyze_all_raffles()
        analyzer.print_analysis(metrics)
        
    except Exception as e:
        logger.error(f"Analysis failed: {str(e)}", exc_info=True)

if __name__ == "__main__":
    main()