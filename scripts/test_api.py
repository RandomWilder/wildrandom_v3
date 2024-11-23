# scripts/test_api.py

import os
import sys
from pathlib import Path
import requests
import json
import logging

project_root = str(Path(__file__).parent.parent)
sys.path.append(project_root)

logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class APITester:
    def __init__(self, base_url="http://localhost:5000"):
        self.base_url = base_url
        self.token = None
        
    def register_user(self, username, email, password, first_name="Test", last_name="User"):
        """Register a new user"""
        url = f"{self.base_url}/api/users/register"
        data = {
            "username": username,
            "email": email,
            "password": password,
            "first_name": first_name,
            "last_name": last_name
        }
        
        logger.info(f"Registering user: {username}")
        response = requests.post(url, json=data)
        logger.info(f"Status Code: {response.status_code}")
        logger.info(f"Response: {json.dumps(response.json(), indent=2)}")
        return response.json() if response.ok else None
        
    def login_user(self, username, password):
        """Login user"""
        url = f"{self.base_url}/api/users/login"
        data = {
            "username": username,
            "password": password
        }
        
        logger.info(f"Logging in user: {username}")
        response = requests.post(url, json=data)
        logger.info(f"Status Code: {response.status_code}")
        logger.info(f"Response: {json.dumps(response.json(), indent=2)}")
        
        if response.ok:
            self.token = response.json().get('token')
        return response.json() if response.ok else None
        
    def get_profile(self):
        """Get user profile"""
        if not self.token:
            logger.error("No token available. Please login first.")
            return None
            
        url = f"{self.base_url}/api/users/me"
        headers = {"Authorization": f"Bearer {self.token}"}
        
        logger.info("Getting user profile")
        response = requests.get(url, headers=headers)
        logger.info(f"Status Code: {response.status_code}")
        logger.info(f"Response: {json.dumps(response.json(), indent=2)}")
        return response.json() if response.ok else None

def run_tests():
    """Run a series of API tests"""
    tester = APITester()
    
    # Test 1: Register new user
    logger.info("\n=== Test 1: Register New User ===")
    user = tester.register_user(
        username="apitestuser",
        email="apitest@test.com",
        password="TestAPI123!",
        first_name="API",
        last_name="Test"
    )
    
    if user:
        # Test 2: Login with new user
        logger.info("\n=== Test 2: Login User ===")
        login_result = tester.login_user("apitestuser", "TestAPI123!")
        
        if login_result:
            # Test 3: Get profile
            logger.info("\n=== Test 3: Get Profile ===")
            profile = tester.get_profile()

if __name__ == "__main__":
    logger.info("Starting API tests...")
    run_tests()