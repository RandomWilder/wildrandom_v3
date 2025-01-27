# src/api_gateway_service/cache/strategies.py

from enum import Enum
from typing import Any, Dict, Optional
from datetime import datetime, timedelta

class CacheStrategy(Enum):
    """Cache strategy definitions for different data types"""
    
    # User data caching
    USER_PROFILE = {
        'ttl': 300,  # 5 minutes
        'namespace': 'user_profiles'
    }
    
    # Raffle data caching
    ACTIVE_RAFFLES = {
        'ttl': 60,   # 1 minute
        'namespace': 'active_raffles'
    }
    
    RAFFLE_DETAILS = {
        'ttl': 120,  # 2 minutes
        'namespace': 'raffle_details'
    }
    
    # Composite data caching
    USER_DASHBOARD = {
        'ttl': 180,  # 3 minutes
        'namespace': 'user_dashboards'
    }
    
    # Static data caching
    STATIC_CONTENT = {
        'ttl': 3600,  # 1 hour
        'namespace': 'static_content'
    }

    def get_config(self) -> Dict[str, Any]:
        """Get strategy configuration"""
        return self.value

    def get_ttl(self) -> int:
        """Get TTL in seconds"""
        return self.value['ttl']

    def get_namespace(self) -> str:
        """Get cache namespace"""
        return self.value['namespace']

class CacheInvalidationPattern(Enum):
    """Invalidation patterns for different update scenarios"""
    
    USER_UPDATE = {
        'patterns': [
            'user_profiles:*',
            'user_dashboards:*'
        ]
    }
    
    RAFFLE_UPDATE = {
        'patterns': [
            'active_raffles:*',
            'raffle_details:*',
            'user_dashboards:*'
        ]
    }
    
    FULL_REFRESH = {
        'patterns': ['*']
    }

    def get_patterns(self) -> list:
        """Get invalidation patterns"""
        return self.value['patterns']