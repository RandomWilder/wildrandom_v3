# src/shared/auth.py

from functools import wraps
from flask import request, jsonify, current_app
import jwt
from datetime import datetime, timezone, timedelta
from typing import Optional, Dict

def create_token(user_id: int, additional_data: Optional[Dict] = None) -> str:
    """Create JWT token"""
    payload = {
        'user_id': user_id,
        'exp': datetime.now(timezone.utc) + timedelta(seconds=current_app.config['JWT_ACCESS_TOKEN_EXPIRES']),
        'iat': datetime.now(timezone.utc)
    }
    
    if additional_data:
        payload.update(additional_data)
        
    return jwt.encode(
        payload,
        current_app.config['JWT_SECRET_KEY'],
        algorithm='HS256'
    )

def token_required(f):
    """Decorator to validate JWT token"""
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        
        # Get token from header
        if 'Authorization' in request.headers:
            auth_header = request.headers['Authorization']
            try:
                token = auth_header.split(" ")[1]
            except IndexError:
                return jsonify({'error': 'Invalid token format'}), 401

        if not token:
            return jsonify({'error': 'Token is missing'}), 401

        try:
            # Decode token
            data = jwt.decode(
                token,
                current_app.config['JWT_SECRET_KEY'],
                algorithms=['HS256']
            )
            
            # Get user
            from src.user_service.models import User
            current_user = User.query.get(data['user_id'])
            
            if not current_user:
                return jsonify({'error': 'Invalid user'}), 401
                
            if not current_user.is_active:
                return jsonify({'error': 'User account is deactivated'}), 401
            
            request.current_user = current_user
            
        except jwt.ExpiredSignatureError:
            return jsonify({'error': 'Token has expired'}), 401
        except jwt.InvalidTokenError:
            return jsonify({'error': 'Invalid token'}), 401

        return f(*args, **kwargs)
    return decorated

def admin_required(f):
    """Decorator to require admin privileges"""
    @wraps(f)
    def decorated(*args, **kwargs):
        token_result = token_required(lambda: None)()
        if token_result is not None:
            return token_result
            
        if not request.current_user.is_admin:
            return jsonify({'error': 'Admin privileges required'}), 403
            
        return f(*args, **kwargs)
    return decorated