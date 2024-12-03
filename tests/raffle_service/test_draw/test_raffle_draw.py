"""Raffle Draw Test Runner"""

import os
import sys
from pathlib import Path

# Add project root to Python path
project_root = str(Path(__file__).parent.parent.parent.parent)
sys.path.append(project_root)

from flask import current_app
from app import create_app
from src.shared import db
from .test_raffle_draw import run_draw_test

def main():
    """Run raffle draw tests"""
    # Create application context
    app = create_app('testing')
    
    with app.app_context():
        # Ensure database is ready
        db.create_all()
        
        try:
            # Run tests with admin ID 2
            run_draw_test(admin_id=2)
        except Exception as e:
            print(f"Test execution failed: {str(e)}")
        finally:
            # Cleanup
            db.session.remove()

if __name__ == "__main__":
    main()