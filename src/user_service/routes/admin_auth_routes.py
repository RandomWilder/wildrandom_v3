# src/user_service/routes/admin_auth_routes.py

from flask import Blueprint, request, jsonify
from src.shared.auth import token_required, admin_required
from src.user_service.models.user import User
from src.user_service.services.user_service import UserService
from src.user_service.services.activity_service import ActivityService
from src.user_service.services.admin_auth_service import AdminAuthService
from src.user_service.schemas.admin_schema import (
    AdminLoginSchema,
    AdminUserManagementSchema,
    AdminResponseSchema
)
from marshmallow import ValidationError
import logging

logger = logging.getLogger(__name__)

admin_auth_bp = Blueprint('admin_auth', __name__, url_prefix='/api/admin')

@admin_auth_bp.route('/login', methods=['POST'])
def admin_login():
    """Admin login endpoint"""
    try:
        schema = AdminLoginSchema()
        data = schema.load(request.get_json())

        result, error = AdminAuthService.authenticate_admin(
            username=data['username'],
            password=data['password'],
            request=request
        )

        if error:
            return jsonify({'error': error}), 401

        return jsonify(result), 200

    except ValidationError as e:
        return jsonify({'error': e.messages}), 400
    except Exception as e:
        logger.error(f"Admin login error: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500

@admin_auth_bp.route('/verify', methods=['GET'])
@token_required
def verify_admin():
    """Verify admin status"""
    try:
        current_user = request.current_user
        
        if not current_user:
            return jsonify({'error': 'User not found'}), 404
            
        if not current_user.is_admin:
            return jsonify({'error': 'Unauthorized access'}), 403

        schema = AdminResponseSchema()
        return jsonify({'user': schema.dump(current_user)}), 200
            
    except Exception as e:
        logger.error(f"Admin verification error: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500

@admin_auth_bp.route('/users', methods=['GET'])
@token_required
@admin_required
def list_users():
    """List all users (admin only)"""
    try:
        users = User.query.all()
        schema = AdminResponseSchema(many=True)
        return jsonify({'users': schema.dump(users)}), 200

    except Exception as e:
        logger.error(f"User listing error: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500
    
@admin_auth_bp.route('/users/<int:user_id>', methods=['GET'])
@token_required
@admin_required
def get_user(user_id):
    """Get enhanced user details including gaming metrics"""
    try:
        enhanced_data, error = AdminAuthService.get_enhanced_user_details(user_id)
        if error:
            return jsonify({'error': error}), 404

        return jsonify({'user': enhanced_data}), 200

    except Exception as e:
        logger.error(f"Error fetching enhanced user data: {str(e)}", exc_info=True)
        return jsonify({'error': str(e)}), 500

@admin_auth_bp.route('/users/<int:user_id>', methods=['PUT'])
@token_required
@admin_required
def manage_user(user_id):
    """Manage user status and roles"""
    try:
        schema = AdminUserManagementSchema()
        data = schema.load(request.get_json())

        result, error = AdminAuthService.manage_user(
            user_id=user_id,
            admin_id=request.current_user.id,
            data=data
        )

        if error:
            return jsonify({'error': error}), 400

        response_schema = AdminResponseSchema()
        return jsonify(response_schema.dump(result)), 200

    except ValidationError as e:
        return jsonify({'error': e.messages}), 400
    except Exception as e:
        logger.error(f"User management error: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500