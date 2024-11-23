# src/user_service/services/oauth_service.py

from typing import Optional, Tuple, Dict
import requests
from oauthlib.oauth2 import WebApplicationClient
from src.shared.oauth_config import OAuthConfig
from src.user_service.models import User
from src.shared import db
import logging

logger = logging.getLogger(__name__)

class OAuthService:
    """Handle OAuth authentication flows"""
    
    @staticmethod
    def get_google_auth_url() -> str:
        """Generate Google OAuth URL"""
        client = WebApplicationClient(OAuthConfig.GOOGLE_CLIENT_ID)
        
        # Get Google's OAuth configuration
        google_config = requests.get(OAuthConfig.GOOGLE_DISCOVERY_URL).json()
        
        return client.prepare_request_uri(
            google_config['authorization_endpoint'],
            redirect_uri=OAuthConfig.OAUTH_REDIRECT_URI,
            scope=OAuthConfig.GOOGLE_SCOPES
        )
    
    @staticmethod
    def handle_google_callback(code: str) -> Tuple[Optional[Dict], Optional[str]]:
        """Handle Google OAuth callback"""
        try:
            # Exchange code for tokens
            client = WebApplicationClient(OAuthConfig.GOOGLE_CLIENT_ID)
            google_config = requests.get(OAuthConfig.GOOGLE_DISCOVERY_URL).json()
            
            token_response = requests.post(
                google_config['token_endpoint'],
                data=client.prepare_token_request(
                    google_config['token_endpoint'],
                    authorization_response=code,
                    redirect_url=OAuthConfig.OAUTH_REDIRECT_URI
                )[1]
            )
            
            tokens = client.parse_request_body_response(token_response.text)
            
            # Get user info from Google
            userinfo_response = requests.get(
                google_config['userinfo_endpoint'],
                headers={'Authorization': f'Bearer {tokens["access_token"]}'}
            )
            
            google_user = userinfo_response.json()
            
            # Find or create user
            user = User.query.filter_by(google_id=google_user['sub']).first()
            
            if not user:
                # Create new user
                user = User(
                    username=google_user['email'].split('@')[0],  # Use email prefix as username
                    email=google_user['email'],
                    first_name=google_user.get('given_name'),
                    last_name=google_user.get('family_name'),
                    auth_provider='google',
                    google_id=google_user['sub'],
                    is_verified=True  # Auto-verify Google users
                )
                
                db.session.add(user)
                db.session.commit()
            
            # Create session token
            from src.shared.auth import create_token
            token = create_token(user.id)
            
            return {
                'user': user.to_dict(),
                'token': token,
                'google_tokens': tokens  # Include Google tokens for refresh
            }, None
            
        except Exception as e:
            logger.error(f"Google callback error: {str(e)}")
            return None, str(e)
    
    @staticmethod
    def refresh_google_token(refresh_token: str) -> Tuple[Optional[Dict], Optional[str]]:
        """Refresh Google OAuth token"""
        try:
            client = WebApplicationClient(OAuthConfig.GOOGLE_CLIENT_ID)
            google_config = requests.get(OAuthConfig.GOOGLE_DISCOVERY_URL).json()
            
            token_response = requests.post(
                google_config['token_endpoint'],
                data={
                    'client_id': OAuthConfig.GOOGLE_CLIENT_ID,
                    'client_secret': OAuthConfig.GOOGLE_CLIENT_SECRET,
                    'refresh_token': refresh_token,
                    'grant_type': 'refresh_token'
                }
            )
            
            new_tokens = token_response.json()
            return {'tokens': new_tokens}, None
            
        except Exception as e:
            logger.error(f"Token refresh error: {str(e)}")
            return None, str(e)