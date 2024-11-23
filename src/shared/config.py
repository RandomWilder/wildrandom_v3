# config.py

import os
from datetime import timedelta

class Config:
    """Base configuration"""
    # Flask
    SECRET_KEY = os.getenv('SECRET_KEY', 'dev-secret-key-change-in-production')
    DEBUG = os.getenv('FLASK_DEBUG', '0') == '1'
    
    # Database
    DB_USER = os.getenv('DB_USER', 'root')
    DB_PASSWORD = os.getenv('DB_PASSWORD', 'WildRandom2024#Dev')
    DB_HOST = os.getenv('DB_HOST', 'localhost')
    DB_PORT = os.getenv('DB_PORT', '3306')
    DB_NAME = os.getenv('DB_NAME', 'wildrandom_v3_db')
    
    SQLALCHEMY_DATABASE_URI = f'mysql+pymysql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}'
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    # JWT
    JWT_SECRET_KEY = os.getenv('JWT_SECRET_KEY', 'jwt-dev-key-change-in-production')
    JWT_ACCESS_TOKEN_EXPIRES = int(os.getenv('JWT_ACCESS_TOKEN_EXPIRES', 3600))
    
    # Logging
    LOG_LEVEL = os.getenv('LOG_LEVEL', 'DEBUG')
    LOG_FILE = os.getenv('LOG_FILE', 'logs/app.log')
    
    # Admin
    ADMIN_USERNAME = os.getenv('ADMIN_USERNAME', 'admin')
    ADMIN_PASSWORD = os.getenv('ADMIN_PASSWORD', 'admin-password-change-me')
    ADMIN_EMAIL = os.getenv('ADMIN_EMAIL', 'admin@example.com')

    # User Service
    PASSWORD_RESET_EXPIRY = int(os.getenv('PASSWORD_RESET_EXPIRY', 24 * 60 * 60))  # 24 hours in seconds
    MIN_PASSWORD_LENGTH = int(os.getenv('MIN_PASSWORD_LENGTH', 8))
    REQUIRE_EMAIL_VERIFICATION = os.getenv('REQUIRE_EMAIL_VERIFICATION', '0') == '1'
    
    # Rate Limiting
    RATELIMIT_DEFAULT = "200 per day"
    RATELIMIT_STORAGE_URL = "memory://"

class TestConfig(Config):
    """Test configuration"""
    TESTING = True
    DB_NAME = os.getenv('TEST_DB_NAME', 'wildrandom_v3_test_db')
    SQLALCHEMY_DATABASE_URI = f'mysql+pymysql://{Config.DB_USER}:{Config.DB_PASSWORD}@{Config.DB_HOST}:{Config.DB_PORT}/{DB_NAME}'

config = {
    'development': Config,
    'testing': TestConfig,
    'default': Config
}