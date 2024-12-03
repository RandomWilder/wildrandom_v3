# scripts/analyze_prizes.py

import os
import sys
from pathlib import Path
import logging
from datetime import datetime, timezone
from tabulate import tabulate

# Add project root to path
project_root = str(Path(__file__).parent.parent)
sys.path.append(project_root)

from app import create_app
from src.shared import db
from src.prize_center_service.models import (
    PrizeInstance, 
    InstanceStatus,
    PrizePool,
    PoolStatus
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

def analyze_prize_instances():
    """Analyze and display prize instance states and statistics"""
    app = create_app()
    
    with app.app_context():
        try:
            # Get all instances
            instances = PrizeInstance.query.all()
            
            # State statistics
            state_stats = {status.value: 0 for status in InstanceStatus}
            for instance in instances:
                state_stats[instance.status] += 1
                
            # Detailed instance information
            instance_data = []
            for instance in instances:
                instance_data.append([
                    instance.instance_id,
                    instance.status,
                    instance.instance_type,
                    float(instance.credit_value),
                    instance.discovering_ticket_id or 'N/A',
                    instance.claimed_by_id or 'N/A',
                    instance.discovery_time.strftime('%Y-%m-%d %H:%M:%S') if instance.discovery_time else 'N/A',
                    instance.claimed_at.strftime('%Y-%m-%d %H:%M:%S') if instance.claimed_at else 'N/A'
                ])
            
            # Print summary
            print("\n=== Prize Instance Analysis ===\n")
            print("State Distribution:")
            for state, count in state_stats.items():
                print(f"{state:12} : {count:5}")
                
            print("\n=== Detailed Instance Information ===\n")
            headers = [
                "Instance ID", 
                "Status", 
                "Type",
                "Credit Value",
                "Discovering Ticket",
                "Claimed By",
                "Discovery Time",
                "Claim Time"
            ]
            print(tabulate(instance_data, headers=headers, tablefmt="grid"))
            
        except Exception as e:
            logger.error(f"Analysis failed: {str(e)}", exc_info=True)

if __name__ == "__main__":
    analyze_prize_instances()