# src/shared/oauth_config.py

from typing import Dict
import os

class OAuthConfig:
    """OAuth Configuration"""
    
    # Google OAuth2 settings
    GOOGLE_CLIENT_ID = os.getenv('GOOGLE_CLIENT_ID')
    GOOGLE_CLIENT_SECRET = os.getenv('GOOGLE_CLIENT_SECRET')
    GOOGLE_DISCOVERY_URL = "https://accounts.google.com/.well-known/openid-configuration"
    
    # Redirect URI for OAuth callbacks
    OAUTH_REDIRECT_URI = os.getenv('OAUTH_REDIRECT_URI', 'http://localhost:5000/api/auth/google/callback')
    
    # Scopes needed for Google sign-in
    GOOGLE_SCOPES = [
        'openid',
        'email',
        'profile'
    ]
    
    @staticmethod
    def get_google_config() -> Dict:
        """Get Google OAuth configuration"""
        return {
            'client_id': OAuthConfig.GOOGLE_CLIENT_ID,
            'client_secret': OAuthConfig.GOOGLE_CLIENT_SECRET,
            'redirect_uri': OAuthConfig.OAUTH_REDIRECT_URI,
            'scope': OAuthConfig.GOOGLE_SCOPES,
            'discovery_url': OAuthConfig.DISCOVERY_URL
        }