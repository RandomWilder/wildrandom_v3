#!/usr/bin/env python3

import os
import sys
from pathlib import Path
from datetime import datetime
from tabulate import tabulate
import shutil

# Add project root to Python path
project_root = str(Path(__file__).parent.parent)
sys.path.append(project_root)

from app import create_app
from src.shared import db
from src.prize_center_service.models import (
    PrizeTemplate,
    PrizePool,
    PoolStatus
)
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def get_terminal_width():
    """Get terminal width, default to 80 if can't detect"""
    return shutil.get_terminal_size().columns

def truncate_string(s, max_len):
    """Truncate string with ellipsis if too long"""
    return s if len(s) <= max_len else s[:max_len-3] + "..."

def format_currency(value):
    """Format decimal to currency string"""
    return f"${float(value):,.0f}"  # Removed decimal places to save space

def format_datetime(dt):
    """Format datetime to string"""
    return dt.strftime("%Y-%m-%d") if dt else "N/A"  # Removed time to save space

def list_templates():
    """List all prize templates"""
    try:
        templates = PrizeTemplate.query.filter_by(is_deleted=False).all()
        
        if not templates:
            print("\nNo prize templates found.")
            return

        # Prepare table data with truncated strings
        table_data = []
        for t in templates:
            table_data.append([
                t.id,
                truncate_string(t.name, 20),
                t.type.value.split('_')[0],  # Just 'instant' or 'draw'
                t.tier.value[:3].upper(),  # First 3 letters of tier
                format_currency(t.retail_value),
                format_currency(t.cash_value),
                format_currency(t.credit_value),
                t.total_instances,
                t.instances_claimed,
                format_datetime(t.created_at)
            ])

        # Print table
        headers = [
            "ID", "Name", "Type", "Tier", 
            "Retail", "Cash", "Credit",
            "Total", "Used", "Created"
        ]
        
        print("\n=== Prize Templates ===")
        print(tabulate(
            table_data,
            headers=headers,
            tablefmt="simple",
            numalign="right",
            stralign="left",
            maxcolwidths=[None, 20, 8, 4, 10, 10, 10, 6, 6, 10]
        ))

    except Exception as e:
        logger.error(f"Error listing templates: {str(e)}")

def list_pools():
    """List all prize pools"""
    try:
        pools = PrizePool.query.order_by(PrizePool.created_at.desc()).all()
        
        if not pools:
            print("\nNo prize pools found.")
            return

        # Prepare table data
        table_data = []
        for p in pools:
            table_data.append([
                p.id,
                truncate_string(p.name, 20),
                p.status.value[:3].upper(),  # First 3 letters of status
                p.total_instances,
                p.instant_win_instances,
                p.draw_win_instances,
                format_currency(p.retail_total),
                format_currency(p.cash_total),
                f"{p.total_odds:.0f}%",
                format_datetime(p.locked_at) if p.locked_at else '-'
            ])

        # Print table
        headers = [
            "ID", "Name", "Sts", 
            "Total", "Inst", "Draw",
            "Retail", "Cash", "Odds",
            "Locked"
        ]
        
        print("\n=== Prize Pools ===")
        print(tabulate(
            table_data,
            headers=headers,
            tablefmt="simple",
            numalign="right",
            stralign="left",
            maxcolwidths=[None, 20, 4, 6, 6, 6, 10, 10, 6, 10]
        ))

    except Exception as e:
        logger.error(f"Error listing pools: {str(e)}")

def main():
    """Main function"""
    app = create_app()
    
    with app.app_context():
        # Get terminal width and adjust output accordingly
        term_width = get_terminal_width()
        print(f"\nTerminal width: {term_width} characters")
        
        list_templates()
        print("\n")  # Add spacing between tables
        list_pools()
        print("\n")  # Add final spacing

if __name__ == "__main__":
    main()