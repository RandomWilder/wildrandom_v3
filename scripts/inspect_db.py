"""
Database Inspector Tool - Fixed version with proper path handling and imports.
"""

import os
import sys
from pathlib import Path
from typing import Dict, List, Optional, Any, Tuple
from dataclasses import dataclass
from datetime import datetime
from decimal import Decimal
from sqlalchemy.engine.row import Row
from sqlalchemy import text, inspect
import argparse
from tabulate import tabulate
import logging

# Ensure proper path handling
PROJECT_ROOT = str(Path(__file__).parent.parent.absolute())
sys.path.append(PROJECT_ROOT)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(message)s'  # Clean format for data display
)
logger = logging.getLogger(__name__)

@dataclass
class DatabaseStats:
    """Container for database statistics"""
    total_records: int
    column_count: int
    nullable_columns: int
    indexed_columns: int

class DatabaseInspector:
    """Database inspection tool with comprehensive analysis capabilities"""
    
    def __init__(self):
        """Initialize database connection and Flask context"""
        # Import here to avoid path issues
        from flask import Flask
        from src.shared import db
        from src.shared.config import config
        
        # Initialize Flask app with proper configuration
        self.app = Flask(__name__)
        self.app.config.from_object(config['development'])
        
        # Initialize database
        db.init_app(self.app)
        self.db = db
        
        # Push application context
        self.ctx = self.app.app_context()
        self.ctx.push()

    def cleanup(self):
        """Cleanup database connection and context"""
        if hasattr(self, 'ctx'):
            self.ctx.pop()

    def inspect_table(self, table_name: str) -> None:
        """
        Inspect and display table structure and contents.
        
        Args:
            table_name: Name of table to inspect
        """
        try:
            # Get table inspector
            inspector = inspect(self.db.engine)
            
            # Get table information
            if table_name not in inspector.get_table_names():
                print(f"\nTable '{table_name}' not found.")
                print("\nAvailable tables:")
                for t in inspector.get_table_names():
                    print(f"- {t}")
                return
            
            columns = inspector.get_columns(table_name)
            indexes = inspector.get_indexes(table_name)
            
            # Display table structure
            print(f"\n=== Table: {table_name} ===")
            
            # Display columns
            column_data = []
            for col in columns:
                column_data.append([
                    col['name'],
                    str(col['type']),
                    'NULL' if col.get('nullable') else 'NOT NULL',
                    'PK' if col.get('primary_key') else '',
                    str(col.get('default', ''))
                ])
            
            print("\nColumns:")
            print(tabulate(
                column_data,
                headers=['Name', 'Type', 'Nullable', 'Key', 'Default'],
                tablefmt="grid"
            ))
            
            # Display indexes
            if indexes:
                print("\nIndexes:")
                index_data = [[idx['name'], ', '.join(idx['column_names'])] for idx in indexes]
                print(tabulate(
                    index_data,
                    headers=['Name', 'Columns'],
                    tablefmt="grid"
                ))
            
            # Get sample data
            query = text(f"SELECT * FROM {table_name} LIMIT 5")
            result = self.db.session.execute(query)
            rows = []
            for row in result:
                rows.append(dict(row._mapping))
            
            if rows:
                print("\nSample Data:")
                print(tabulate(
                    [list(row.values()) for row in rows],
                    headers=rows[0].keys(),
                    tablefmt="grid"
                ))
            
            # Get record count
            count_query = text(f"SELECT COUNT(*) as count FROM {table_name}")
            count = self.db.session.execute(count_query).scalar()
            print(f"\nTotal Records: {count:,}")

        except Exception as e:
            logger.error(f"Error inspecting table {table_name}: {str(e)}")

    def get_user_transactions(self, user_id: int) -> None:
        """Display user's transaction history"""
        try:
            query = text("""
                SELECT 
                    ct.id,
                    ct.created_at,
                    ct.transaction_type,
                    ct.amount,
                    ct.balance_after,
                    ct.notes,
                    u.username
                FROM credit_transactions ct
                JOIN users u ON ct.user_id = u.id
                WHERE ct.user_id = :user_id
                ORDER BY ct.created_at DESC
            """)
            
            result = self.db.session.execute(query, {"user_id": user_id})
            rows = []
            for row in result:
                rows.append(dict(row._mapping))
            
            if not rows:
                print(f"\nNo transactions found for user_id: {user_id}")
                return
            
            # Format transaction data
            tx_data = []
            for row in rows:
                tx_data.append([
                    row['created_at'].strftime('%Y-%m-%d %H:%M:%S'),
                    row['transaction_type'],
                    f"${float(row['amount']):,.2f}",
                    f"${float(row['balance_after']):,.2f}" if row['balance_after'] else 'N/A',
                    row['notes'] or 'N/A'
                ])
            
            print(f"\n=== Transactions for User: {rows[0]['username']} ===")
            print(tabulate(
                tx_data,
                headers=['Date', 'Type', 'Amount', 'Balance', 'Notes'],
                tablefmt="grid"
            ))
            
        except Exception as e:
            logger.error(f"Error fetching transactions: {str(e)}")

    def get_user_activities(self, user_id: int) -> None:
        """Display user's activity history"""
        try:
            query = text("""
                SELECT 
                    a.created_at,
                    a.activity_type,
                    a.status,
                    a.details,
                    u.username
                FROM user_activities a
                JOIN users u ON a.user_id = u.id
                WHERE a.user_id = :user_id
                ORDER BY a.created_at DESC
            """)
            
            result = self.db.session.execute(query, {"user_id": user_id})
            rows = []
            for row in result:
                rows.append(dict(row._mapping))
            
            if not rows:
                print(f"\nNo activities found for user_id: {user_id}")
                return
            
            # Format activity data
            activity_data = []
            for row in rows:
                activity_data.append([
                    row['created_at'].strftime('%Y-%m-%d %H:%M:%S'),
                    row['activity_type'],
                    row['status'],
                    str(row['details']) if row['details'] else 'N/A'
                ])
            
            print(f"\n=== Activities for User: {rows[0]['username']} ===")
            print(tabulate(
                activity_data,
                headers=['Date', 'Activity', 'Status', 'Details'],
                tablefmt="grid"
            ))
            
        except Exception as e:
            logger.error(f"Error fetching activities: {str(e)}")

def main():
    """Main execution function with argument parsing"""
    parser = argparse.ArgumentParser(description="Database Inspector")
    parser.add_argument("--table", help="Table name to inspect")
    parser.add_argument("--user_id", type=int, help="User ID to analyze")
    args = parser.parse_args()

    inspector = None
    try:
        inspector = DatabaseInspector()

        if args.table:
            inspector.inspect_table(args.table)
        
        if args.user_id:
            inspector.get_user_transactions(args.user_id)
            inspector.get_user_activities(args.user_id)

    finally:
        if inspector:
            inspector.cleanup()

if __name__ == "__main__":
    main()