# src/user_service/routes/protection_routes.py

from flask import Blueprint, request, jsonify
from marshmallow import ValidationError
from src.shared.auth import token_required
from src.user_service.services.protection_service import ProtectionService
from src.user_service.schemas.protection_schema import (
    ProtectionSettingsSchema,
    ProtectionSettingsResponseSchema
)
import logging

logger = logging.getLogger(__name__)

protection_bp = Blueprint('protection', __name__, url_prefix='/api/users/protection')

@protection_bp.route('/settings', methods=['GET'])
@token_required
def get_protection_settings():
    """Get user's protection settings"""
    try:
        settings, error = ProtectionService.get_user_settings(request.current_user.id)
        if error:
            return jsonify({'error': error}), 400

        schema = ProtectionSettingsResponseSchema()
        return jsonify(schema.dump(settings)), 200

    except Exception as e:
        logger.error(f"Error getting protection settings: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500

@protection_bp.route('/settings', methods=['PUT'])
@token_required
def update_protection_settings():
    """Update user's protection settings"""
    try:
        schema = ProtectionSettingsSchema()
        data = schema.load(request.get_json())

        settings, error = ProtectionService.update_settings(
            user_id=request.current_user.id,
            settings_data=data
        )
        if error:
            return jsonify({'error': error}), 400

        response_schema = ProtectionSettingsResponseSchema()
        return jsonify(response_schema.dump(settings)), 200

    except ValidationError as e:
        return jsonify({'error': e.messages}), 400
    except Exception as e:
        logger.error(f"Error updating protection settings: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500