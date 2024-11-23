# src/user_service/routes/password_routes.py

from flask import Blueprint, request, jsonify
from marshmallow import ValidationError
from src.shared.auth import token_required
from src.user_service.services.password_service import PasswordService
from src.user_service.schemas.password_schema import (
    PasswordResetRequestSchema,
    PasswordResetSchema,
    PasswordChangeSchema
)

password_bp = Blueprint('password', __name__, url_prefix='/api/users/password')

@password_bp.route('/reset-request', methods=['POST'])
def request_reset():
    """Request a password reset"""
    try:
        schema = PasswordResetRequestSchema()
        data = schema.load(request.get_json())
        
        result, error = PasswordService.create_reset_request(
            email=data['email']
        )
        if error:
            return jsonify({'error': error}), 400
            
        return jsonify(result), 200
        
    except ValidationError as e:
        return jsonify({'error': e.messages}), 400

@password_bp.route('/reset', methods=['POST'])
def reset_password():
    """Reset password using token"""
    try:
        schema = PasswordResetSchema()
        data = schema.load(request.get_json())
        
        success, error = PasswordService.reset_password(
            token=data['token'],
            new_password=data['new_password']
        )
        if error:
            return jsonify({'error': error}), 400
            
        return jsonify({'message': 'Password reset successful'}), 200
        
    except ValidationError as e:
        return jsonify({'error': e.messages}), 400

@password_bp.route('/change', methods=['PUT'])
@token_required
def change_password():
    """Change password for authenticated user"""
    try:
        schema = PasswordChangeSchema()
        data = schema.load(request.get_json())
        
        success, error = PasswordService.change_password(
            user_id=request.current_user.id,
            current_password=data['current_password'],
            new_password=data['new_password']
        )
        if error:
            return jsonify({'error': error}), 400
            
        return jsonify({'message': 'Password changed successfully'}), 200
        
    except ValidationError as e:
        return jsonify({'error': e.messages}), 400