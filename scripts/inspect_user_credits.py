import sys
import os
from datetime import datetime, timezone
from typing import List, Dict, Any
import json
from pathlib import Path
from tabulate import tabulate
from collections import defaultdict

# Add project root to path for imports
project_root = str(Path(__file__).resolve().parent.parent)
sys.path.insert(0, project_root)

from src.shared import db
from flask import Flask
from src.shared.config import config
from src.user_service.models import User, CreditTransaction
from src.raffle_service.models import Ticket, Raffle

class CreditInspector:
    """Comprehensive credit transaction analysis tool."""
    
    def __init__(self, user_id: int):
        self.user_id = user_id
        self._init_app()
        self.user = self._get_user()

    def _init_app(self) -> None:
        """Initialize Flask app context for database access."""
        app = Flask(__name__)
        app.config.from_object(config['default'])
        db.init_app(app)
        self.app = app

    def _get_user(self) -> User:
        """Retrieve user details."""
        with self.app.app_context():
            user = User.query.get(self.user_id)
            if not user:
                raise ValueError(f"User ID {self.user_id} not found!")
            return user

    def analyze_credits(self) -> None:
        """Perform comprehensive credit transaction analysis."""
        with self.app.app_context():
            self._print_user_header()
            self._analyze_transactions()
            self._analyze_distribution()
            self._analyze_balance_timeline()
            self._analyze_raffle_connections()

    def _print_user_header(self) -> None:
        """Display user overview information."""
        print("\n" + "="*50)
        print(f"🔍 Credit Analysis for User {self.user_id}")
        print(f"Username: {self.user.username}")
        print(f"Current Credits: {self.user.site_credits}")
        print("="*50 + "\n")

    def _analyze_transactions(self) -> None:
        """Analyze and display all credit transactions."""
        transactions = CreditTransaction.query.filter_by(
            user_id=self.user_id
        ).order_by(CreditTransaction.created_at).all()

        if not transactions:
            print("❌ No credit transactions found!")
            return

        print("📊 Credit Transactions:")
        table_data = []
        for tx in transactions:
            table_data.append([
                tx.created_at.strftime('%Y-%m-%d %H:%M:%S'),
                tx.transaction_type,
                f"{tx.amount:,.2f}",
                f"{tx.balance_after:,.2f}",
                tx.reference_type,
                tx.reference_id
            ])

        print(tabulate(
            table_data,
            headers=['Timestamp', 'Type', 'Amount', 'Balance After', 'Ref Type', 'Ref ID'],
            tablefmt='pretty'
        ))

    def _analyze_distribution(self) -> None:
        """Analyze transaction type distribution."""
        transactions = CreditTransaction.query.filter_by(user_id=self.user_id).all()
        distribution = defaultdict(lambda: {'count': 0, 'total_amount': 0})

        for tx in transactions:
            dist = distribution[tx.transaction_type]
            dist['count'] += 1
            dist['total_amount'] += abs(float(tx.amount))

        print("\n📈 Transaction Distribution:")
        table_data = [
            [tx_type, data['count'], f"{data['total_amount']:,.2f}"]
            for tx_type, data in distribution.items()
        ]
        print(tabulate(
            table_data,
            headers=['Type', 'Count', 'Total Amount'],
            tablefmt='pretty'
        ))

    def _analyze_balance_timeline(self) -> None:
        """Generate balance change timeline."""
        transactions = CreditTransaction.query.filter_by(
            user_id=self.user_id
        ).order_by(CreditTransaction.created_at).all()

        print("\n📅 Balance Timeline:")
        if not transactions:
            print("No balance changes found!")
            return

        timeline_data = []
        for tx in transactions:
            timeline_data.append([
                tx.created_at.strftime('%Y-%m-%d %H:%M:%S'),
                f"{tx.amount:,.2f}",
                f"{tx.balance_after:,.2f}",
                "⬆️" if tx.amount > 0 else "⬇️"
            ])

        print(tabulate(
            timeline_data,
            headers=['Timestamp', 'Change', 'New Balance', 'Direction'],
            tablefmt='pretty'
        ))

    def _analyze_raffle_connections(self) -> None:
        """Analyze connections between transactions and raffles."""
        print("\n🎫 Raffle Connections:")
        
        # Get all ticket purchases
        purchases = CreditTransaction.query.filter(
            CreditTransaction.user_id == self.user_id,
            CreditTransaction.reference_type == 'ticket_purchase'
        ).all()

        if not purchases:
            print("No raffle ticket purchases found!")
            return

        raffle_data = []
        for purchase in purchases:
            if purchase.reference_id and purchase.reference_id.startswith('raffle_'):
                raffle_id = int(purchase.reference_id.split('_')[1])
                raffle = Raffle.query.get(raffle_id)
                if raffle:
                    raffle_data.append([
                        raffle.title,
                        f"{abs(float(purchase.amount)):,.2f}",
                        purchase.created_at.strftime('%Y-%m-%d %H:%M:%S')
                    ])

        print(tabulate(
            raffle_data,
            headers=['Raffle Name', 'Amount Spent', 'Purchase Date'],
            tablefmt='pretty'
        ))

def main():
    if len(sys.argv) != 2:
        print("Usage: python inspect_user_credits.py <user_id>")
        sys.exit(1)

    try:
        user_id = int(sys.argv[1])
        inspector = CreditInspector(user_id)
        inspector.analyze_credits()
    except ValueError as e:
        print(f"Error: {e}")
        sys.exit(1)
    except Exception as e:
        print(f"Unexpected error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()