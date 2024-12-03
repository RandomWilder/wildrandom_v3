"""
User Transaction Monitor
Provides comprehensive view of user's in-system financial activities including:
- Credit/Debit transactions
- Prize claims
- Ticket purchases
- System balance changes
"""

from dataclasses import dataclass
from datetime import datetime
from decimal import Decimal
from typing import Dict, List, Optional, Any, Tuple
import logging
import os
import sys
from pathlib import Path
from tabulate import tabulate
import requests

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@dataclass
class BalanceSummary:
    """Container for user balance information"""
    current_balance: Decimal = Decimal('0')
    total_credits: Decimal = Decimal('0')
    total_debits: Decimal = Decimal('0')
    prize_claims: int = 0
    ticket_purchases: int = 0

class UserActivityMonitor:
    """
    Monitors user financial activity within the platform.
    
    Tracks and analyzes:
    - Credit transactions (ticket purchases, prize claims)
    - Balance changes
    - Activity history
    """
    
    def __init__(self, base_url: str, token: str):
        self.base_url = base_url.rstrip('/')
        self.token = token.strip()
        self.headers = {
            "Authorization": f"Bearer {self.token}",
            "Content-Type": "application/json"
        }

    def get_credit_transactions(self, user_id: int) -> List[Dict[str, Any]]:
        """
        Fetch all credit transactions for user.
        
        Args:
            user_id: Target user ID
            
        Returns:
            List of credit transaction records
        """
        try:
            url = f"{self.base_url}/api/users/{user_id}/credits"
            response = requests.get(url, headers=self.headers)
            response.raise_for_status()
            
            data = response.json()
            return data.get('transactions', [])
            
        except requests.RequestException as e:
            logger.error(f"Failed to fetch credit transactions: {e}")
            if hasattr(e.response, 'text'):
                logger.error(f"Response: {e.response.text}")
            return []

    def get_user_balance(self, user_id: int) -> Dict[str, Any]:
        """
        Get current user balance information.
        
        Args:
            user_id: Target user ID
            
        Returns:
            Dictionary containing balance information
        """
        try:
            url = f"{self.base_url}/api/users/{user_id}/balance"
            response = requests.get(url, headers=self.headers)
            response.raise_for_status()
            return response.json()
            
        except requests.RequestException as e:
            logger.error(f"Failed to fetch balance: {e}")
            return {}

    def calculate_summary(self, transactions: List[Dict[str, Any]]) -> BalanceSummary:
        """
        Calculate summary metrics from transaction history.
        
        Args:
            transactions: List of transaction records
            
        Returns:
            BalanceSummary containing calculated metrics
        """
        summary = BalanceSummary()
        
        for tx in transactions:
            amount = Decimal(str(tx.get('amount', '0')))
            if amount >= 0:  # Credit
                summary.total_credits += amount
                if tx.get('transaction_type') == 'prize_claim':
                    summary.prize_claims += 1
            else:  # Debit
                summary.total_debits += abs(amount)
                if tx.get('transaction_type') == 'ticket_purchase':
                    summary.ticket_purchases += 1
                    
        summary.current_balance = summary.total_credits - summary.total_debits
        return summary

    def display_credit_transactions(self, transactions: List[Dict[str, Any]]) -> None:
        """
        Display formatted credit transaction history.
        
        Args:
            transactions: List of credit transaction records
        """
        if not transactions:
            logger.info("\nNo credit transactions found")
            return

        # Prepare transaction data
        tx_data = []
        for tx in transactions:
            created_at = datetime.fromisoformat(tx.get('created_at', '')).strftime('%Y-%m-%d %H:%M:%S')
            amount = float(tx.get('amount', 0))
            balance_after = float(tx.get('balance_after', 0))
            
            tx_data.append([
                created_at,
                tx.get('transaction_type', 'N/A'),
                f"${amount:,.2f}",
                f"${balance_after:,.2f}",
                tx.get('notes', 'N/A'),
                tx.get('reference_type', 'N/A')
            ])

        headers = ["Date", "Type", "Amount", "Balance After", "Notes", "Reference"]
        print("\n=== Credit Transaction History ===")
        print(tabulate(tx_data, headers=headers, tablefmt="grid"))

    def display_summary(self, summary: BalanceSummary) -> None:
        """
        Display formatted financial summary.
        
        Args:
            summary: BalanceSummary to display
        """
        summary_data = [
            ["Current Balance", f"${float(summary.current_balance):,.2f}"],
            ["Total Credits", f"${float(summary.total_credits):,.2f}"],
            ["Total Debits", f"${float(summary.total_debits):,.2f}"],
            ["Prize Claims", summary.prize_claims],
            ["Ticket Purchases", summary.ticket_purchases]
        ]
        
        print("\n=== Activity Summary ===")
        print(tabulate(summary_data, tablefmt="grid"))

def main():
    """Main execution flow with error handling"""
    if len(sys.argv) != 2:
        print("Usage: python monitor_transactions.py <user_id>")
        sys.exit(1)

    try:
        user_id = int(sys.argv[1])
    except ValueError:
        logger.error("User ID must be a number")
        sys.exit(1)

    # Get token from environment
    token = os.getenv('TOKEN')
    if not token:
        logger.error("TOKEN environment variable not set")
        sys.exit(1)

    try:
        monitor = UserActivityMonitor("http://localhost:5000", token)
        
        # Fetch credit transactions
        transactions = monitor.get_credit_transactions(user_id)
        
        # Calculate and display summary
        summary = monitor.calculate_summary(transactions)
        monitor.display_summary(summary)
        
        # Display transaction history
        monitor.display_credit_transactions(transactions)

    except Exception as e:
        logger.error(f"Monitoring failed: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()