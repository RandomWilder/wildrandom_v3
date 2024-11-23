# src/user_service/routes/user_routes.py

from flask import Blueprint, request, jsonify
from src.user_service.schemas.user_schema import (
    UserRegistrationSchema, 
    UserLoginSchema,
    UserUpdateSchema
)
from src.user_service.services.user_service import UserService
from src.user_service.services.auth_service import AuthService
from marshmallow import ValidationError
from src.shared.auth import token_required
import logging

logger = logging.getLogger(__name__)

user_bp = Blueprint('user', __name__, url_prefix='/api/users')

@user_bp.route('/register', methods=['POST'])
def register():
    """Register a new user"""
    try:
        schema = UserRegistrationSchema()
        data = schema.load(request.get_json())
        
        logger.debug("Registration attempt with data:")
        logger.debug(f"Username: {data.get('username')}")
        logger.debug(f"Email: {data.get('email')}")
        logger.debug(f"Has password: {bool(data.get('password'))}")
        
        user, error = UserService.create_user(data)
        if error:
            logger.error(f"Registration failed: {error}")
            return jsonify({'error': error}), 400
            
        # Verify password was set
        logger.debug("User created successfully:")
        logger.debug(f"ID: {user.id}")
        logger.debug(f"Has password hash: {bool(user.password_hash)}")
        if user.password_hash:
            logger.debug(f"Password hash: {user.password_hash[:20]}...")
        
        # Try password verification immediately
        verify_result = user.check_password(data['password'])
        logger.debug(f"Immediate password verification result: {verify_result}")
        
        return jsonify(user.to_dict()), 201
        
    except ValidationError as e:
        logger.error(f"Validation error: {str(e)}")
        return jsonify({'error': e.messages}), 400

@user_bp.route('/login', methods=['POST'])
def login():
    """Login a user"""
    try:
        schema = UserLoginSchema()
        data = schema.load(request.get_json())
        
        result, error = AuthService.authenticate(
            username=data['username'],
            password=data['password']
        )
        if error:
            return jsonify({'error': error}), 401
            
        return jsonify(result), 200
        
    except ValidationError as e:
        return jsonify({'error': e.messages}), 400

@user_bp.route('/me', methods=['GET'])
@token_required
def get_current_user():
    """Get current user profile"""
    return jsonify(request.current_user.to_dict())

@user_bp.route('/profile', methods=['PUT'])
@token_required
def update_profile():
    """Update user profile"""
    try:
        schema = UserUpdateSchema()
        data = schema.load(request.get_json())
        
        user, error = UserService.update_user(
            user_id=request.current_user.id,
            data=data
        )
        if error:
            return jsonify({'error': error}), 400
            
        return jsonify(user.to_dict()), 200
        
    except ValidationError as e:
        return jsonify({'error': e.messages}), 400