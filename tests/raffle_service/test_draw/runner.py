"""Test runner for raffle draw tests"""

import os
import sys
from pathlib import Path
import logging

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

# Add project root to Python path
project_root = str(Path(__file__).parent.parent.parent.parent)
sys.path.append(project_root)

from app import create_app
from src.shared import db
from .core import RaffleDrawTester

def run_draw_test(admin_id: int) -> None:
    """Run complete draw testing sequence"""
    app = create_app('testing')
    
    with app.app_context():
        tester = RaffleDrawTester(admin_id)
        
        try:
            # Setup
            success, error = tester.setup_test_environment()
            if not success:
                logging.error(f"Setup failed: {error}")
                return
                
            # Execute draw
            success, error = tester.execute_draw()
            if not success:
                logging.error(f"Draw execution failed: {error}")
                return
                
            # Verify results
            success, error = tester.verify_draw_results()
            if not success:
                logging.error(f"Result verification failed: {error}")
                return
                
            logging.info("Draw test completed successfully")
            
        except Exception as e:
            logging.error(f"Test execution failed: {str(e)}")
        finally:
            tester.cleanup()

if __name__ == "__main__":
    run_draw_test(admin_id=2)