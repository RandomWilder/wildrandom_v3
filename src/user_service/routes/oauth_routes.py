# src/user_service/routes/oauth_routes.py

from flask import Blueprint, request, jsonify, redirect, url_for
from src.shared.oauth_config import OAuthConfig
from src.user_service.services.oauth_service import OAuthService
import logging

logger = logging.getLogger(__name__)

oauth_bp = Blueprint('oauth', __name__, url_prefix='/api/auth')

@oauth_bp.route('/google/login', methods=['GET'])
def google_login():
    """Initiate Google OAuth flow"""
    try:
        auth_url = OAuthService.get_google_auth_url()
        return jsonify({'auth_url': auth_url})
    except Exception as e:
        logger.error(f"Google login error: {str(e)}")
        return jsonify({'error': 'Failed to initiate Google login'}), 500

@oauth_bp.route('/google/callback', methods=['GET'])
def google_callback():
    """Handle Google OAuth callback"""
    try:
        # Get authorization code from request
        code = request.args.get('code')
        if not code:
            return jsonify({'error': 'No authorization code received'}), 400
            
        # Exchange code for tokens and user info
        result, error = OAuthService.handle_google_callback(code)
        if error:
            return jsonify({'error': error}), 400
            
        return jsonify(result)
        
    except Exception as e:
        logger.error(f"Google callback error: {str(e)}")
        return jsonify({'error': 'Failed to complete Google authentication'}), 500

@oauth_bp.route('/google/refresh', methods=['POST'])
def refresh_google_token():
    """Refresh Google OAuth token"""
    try:
        refresh_token = request.json.get('refresh_token')
        if not refresh_token:
            return jsonify({'error': 'No refresh token provided'}), 400
            
        result, error = OAuthService.refresh_google_token(refresh_token)
        if error:
            return jsonify({'error': error}), 400
            
        return jsonify(result)
        
    except Exception as e:
        logger.error(f"Token refresh error: {str(e)}")
        return jsonify({'error': 'Failed to refresh token'}), 500