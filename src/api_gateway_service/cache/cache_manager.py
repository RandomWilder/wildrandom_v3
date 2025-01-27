# src/api_gateway_service/cache/cache_manager.py

from typing import Any, Dict, Optional, Union
from datetime import datetime, timezone
import logging
from redis import Redis, ConnectionError
from functools import wraps
import json

logger = logging.getLogger(__name__)

class CacheManager:
    """
    Manages distributed caching for the API Gateway with Redis backend.
    Implements intelligent caching strategies with proper invalidation and error handling.
    """

    def __init__(
        self,
        redis_client: Redis,
        default_ttl: int = 300,  # 5 minutes default
        namespace: str = 'gateway'
    ):
        """
        Initialize cache manager with Redis connection and configuration.
        
        Args:
            redis_client: Configured Redis client instance
            default_ttl: Default cache TTL in seconds
            namespace: Cache key namespace for isolation
        """
        self.redis = redis_client
        self.default_ttl = default_ttl
        self.namespace = namespace
        self._verify_connection()

    def _verify_connection(self) -> None:
        """Verify Redis connection on startup"""
        try:
            self.redis.ping()
            logger.info("Cache connection verified successfully")
        except ConnectionError as e:
            logger.error(f"Cache connection failed: {str(e)}")
            raise

    def _build_key(self, key: str) -> str:
        """
        Build namespaced cache key.
        
        Args:
            key: Base cache key
            
        Returns:
            Namespaced cache key
        """
        return f"{self.namespace}:{key}"

    async def get(self, key: str) -> Optional[Any]:
        """
        Retrieve value from cache with error handling.
        
        Args:
            key: Cache key
            
        Returns:
            Cached value if exists and valid
        """
        try:
            cached = self.redis.get(self._build_key(key))
            if cached:
                return json.loads(cached)
            return None
        except Exception as e:
            logger.error(f"Cache get error: {str(e)}")
            return None

    async def set(
        self,
        key: str,
        value: Any,
        expiry: Optional[int] = None
    ) -> bool:
        """
        Store value in cache with serialization.
        
        Args:
            key: Cache key
            value: Value to cache
            expiry: Optional TTL override
            
        Returns:
            True if successful
        """
        try:
            serialized = json.dumps(value)
            return self.redis.set(
                self._build_key(key),
                serialized,
                ex=expiry or self.default_ttl
            )
        except Exception as e:
            logger.error(f"Cache set error: {str(e)}")
            return False

    async def delete(self, key: str) -> bool:
        """
        Remove value from cache.
        
        Args:
            key: Cache key
            
        Returns:
            True if successful
        """
        try:
            return bool(self.redis.delete(self._build_key(key)))
        except Exception as e:
            logger.error(f"Cache delete error: {str(e)}")
            return False

    async def clear_namespace(self) -> bool:
        """
        Clear all keys in current namespace.
        
        Returns:
            True if successful
        """
        try:
            pattern = f"{self.namespace}:*"
            keys = self.redis.keys(pattern)
            if keys:
                return bool(self.redis.delete(*keys))
            return True
        except Exception as e:
            logger.error(f"Cache clear error: {str(e)}")
            return False

    def cache_response(self, ttl: Optional[int] = None):
        """
        Decorator for caching service responses.
        
        Args:
            ttl: Optional TTL override
            
        Returns:
            Decorator function
        """
        def decorator(func):
            @wraps(func)
            async def wrapper(*args, **kwargs):
                # Generate cache key from function args
                key = f"{func.__name__}:{hash(str(args)+str(kwargs))}"
                
                # Try cache first
                cached = await self.get(key)
                if cached:
                    return cached
                
                # Execute function and cache result
                result = await func(*args, **kwargs)
                if result:
                    await self.set(key, result, expiry=ttl)
                    
                return result
            return wrapper
        return decorator