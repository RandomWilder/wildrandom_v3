"""
User Financial Activity Monitor

Provides detailed financial activity tracking for specific users, including:
- Transaction history
- Balance information
- Credit/Debit analysis
- Prize claim history

Usage:
    python monitor_user_financials.py --user_id <id> [--token <auth_token>]
"""

from typing import Dict, List, Optional, Any, Tuple
from dataclasses import dataclass
from datetime import datetime
import requests
import logging
import argparse
from decimal import Decimal
from pathlib import Path
import sys
import json
from tabulate import tabulate

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@dataclass
class FinancialSummary:
    """Financial summary data container with strong typing"""
    user_id: int
    current_balance: Decimal
    available_credit: Decimal
    pending_credit: Decimal
    total_transactions: int
    credit_transactions: int
    debit_transactions: int

class FinancialMonitor:
    """
    Financial activity monitor for specific users.
    
    Provides comprehensive monitoring and analysis of user financial activities
    with proper error handling and response validation.
    """
    
    def __init__(self, base_url: str, auth_token: str):
        """
        Initialize monitor with API configuration.
        
        Args:
            base_url: API base URL
            auth_token: Authentication token
        """
        self.base_url = base_url.rstrip('/')
        self.headers = {
            "Authorization": f"Bearer {auth_token}",
            "Content-Type": "application/json"
        }

    def get_user_transactions(self, user_id: int) -> Tuple[List[Dict[str, Any]], Optional[str]]:
        """
        Fetch transaction history for specific user.
        
        Args:
            user_id: Target user ID
            
        Returns:
            Tuple containing transaction list and optional error message
        """
        try:
            response = requests.get(
                f"{self.base_url}/api/admin/payments/transactions",
                params={"user_id": user_id},
                headers=self.headers
            )
            
            if response.status_code != 200:
                return [], f"API error: {response.status_code} - {response.text}"

            data = response.json()
            return data.get('items', []), None

        except requests.RequestException as e:
            return [], f"Request failed: {str(e)}"
        except json.JSONDecodeError:
            return [], "Invalid response format"

    def get_user_balance(self, user_id: int) -> Tuple[Dict[str, Any], Optional[str]]:
        """
        Fetch current balance information for specific user.
        
        Args:
            user_id: Target user ID
            
        Returns:
            Tuple containing balance info and optional error message
        """
        try:
            response = requests.get(
                f"{self.base_url}/api/admin/payments/user/{user_id}/balance",
                headers=self.headers
            )
            
            if response.status_code != 200:
                return {}, f"API error: {response.status_code} - {response.text}"

            return response.json(), None

        except requests.RequestException as e:
            return {}, f"Request failed: {str(e)}"

    def calculate_summary(self, user_id: int, transactions: List[Dict[str, Any]], balance: Dict[str, Any]) -> FinancialSummary:
        """
        Calculate financial summary from transaction data.
        
        Args:
            user_id: Target user ID
            transactions: List of transaction records
            balance: Current balance information
            
        Returns:
            FinancialSummary object with calculated metrics
        """
        credit_count = sum(1 for t in transactions if t.get('type') == 'credit')
        debit_count = sum(1 for t in transactions if t.get('type') == 'debit')
        
        return FinancialSummary(
            user_id=user_id,
            current_balance=Decimal(str(balance.get('available_amount', '0'))),
            available_credit=Decimal(str(balance.get('available_amount', '0'))),
            pending_credit=Decimal(str(balance.get('pending_amount', '0'))),
            total_transactions=len(transactions),
            credit_transactions=credit_count,
            debit_transactions=debit_count
        )

    def display_transactions(self, transactions: List[Dict[str, Any]]) -> None:
        """
        Display formatted transaction history.
        
        Args:
            transactions: List of transaction records
        """
        if not transactions:
            logger.info("No transactions found")
            return

        # Prepare transaction data for display
        tx_data = []
        for tx in transactions:
            tx_data.append([
                tx.get('id'),
                datetime.fromisoformat(tx['created_at']).strftime('%Y-%m-%d %H:%M'),
                tx.get('type', 'unknown'),
                tx.get('reference_type', 'unknown'),
                f"${float(tx.get('amount', 0)):,.2f}",
                tx.get('status', 'unknown')
            ])
        
        headers = ["ID", "Date", "Type", "Reference", "Amount", "Status"]
        logger.info("\n=== Transaction History ===\n")
        logger.info(tabulate(tx_data, headers=headers, tablefmt="grid"))

    def display_summary(self, summary: FinancialSummary) -> None:
        """
        Display formatted financial summary.
        
        Args:
            summary: FinancialSummary object to display
        """
        summary_data = [
            ["User ID", summary.user_id],
            ["Current Balance", f"${float(summary.current_balance):,.2f}"],
            ["Available Credit", f"${float(summary.available_credit):,.2f}"],
            ["Pending Credit", f"${float(summary.pending_credit):,.2f}"],
            ["Total Transactions", summary.total_transactions],
            ["Credit Transactions", summary.credit_transactions],
            ["Debit Transactions", summary.debit_transactions]
        ]
        
        logger.info("\n=== Financial Summary ===\n")
        logger.info(tabulate(summary_data, tablefmt="grid"))

def main():
    """Main execution function with argument parsing and error handling"""
    parser = argparse.ArgumentParser(description="Monitor user financial activity")
    parser.add_argument("--user_id", type=int, required=True, help="Target user ID")
    parser.add_argument("--token", type=str, help="Auth token (optional if using environment variable)")
    parser.add_argument("--url", type=str, default="http://localhost:5000", help="API base URL")
    args = parser.parse_args()

    # Get token from environment if not provided
    token = args.token or os.environ.get("TOKEN")
    if not token:
        logger.error("No authentication token provided")
        sys.exit(1)

    try:
        monitor = FinancialMonitor(args.url, token)
        
        # Fetch user data
        transactions, tx_error = monitor.get_user_transactions(args.user_id)
        if tx_error:
            logger.error(f"Failed to fetch transactions: {tx_error}")
            return

        balance, bal_error = monitor.get_user_balance(args.user_id)
        if bal_error:
            logger.error(f"Failed to fetch balance: {bal_error}")
            return

        # Calculate and display summary
        summary = monitor.calculate_summary(args.user_id, transactions, balance)
        monitor.display_summary(summary)
        monitor.display_transactions(transactions)

    except Exception as e:
        logger.error(f"Error monitoring financials: {str(e)}", exc_info=True)
        sys.exit(1)

if __name__ == "__main__":
    main()