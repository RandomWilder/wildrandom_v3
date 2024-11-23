# src/user_service/routes/loyalty_routes.py

from flask import Blueprint, request, jsonify
from src.shared.auth import token_required
from src.user_service.services.loyalty_service import LoyaltyService
from src.user_service.config.loyalty_config import LoyaltyConfig, UserLevel
from src.user_service.models.user_loyalty import LoyaltyHistory
import logging

logger = logging.getLogger(__name__)

loyalty_bp = Blueprint('loyalty', __name__, url_prefix='/api/users/loyalty')

@loyalty_bp.route('/status', methods=['GET'])
@token_required
def get_loyalty_status():
    """Get user's current loyalty status"""
    try:
        user_id = request.current_user.id
        
        loyalty, error = LoyaltyService.get_user_loyalty(user_id)
        if error:
            return jsonify({'error': error}), 400

        # Get current benefits
        benefits = LoyaltyConfig.get_level_benefits(UserLevel(loyalty.current_level))
        
        return jsonify({
            'level': loyalty.current_level,
            'badges': loyalty.badges,
            'total_entries': loyalty.total_entries,
            'total_spend': loyalty.total_spend,
            'streak_days': loyalty.streak_days,
            'benefits': benefits,
            'last_activity': loyalty.last_activity.isoformat() if loyalty.last_activity else None
        }), 200
        
    except Exception as e:
        logger.error(f"Error getting loyalty status: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500

@loyalty_bp.route('/benefits', methods=['GET'])
@token_required
def get_level_benefits():
    """Get benefits for all levels"""
    try:
        return jsonify({
            'levels': {
                level.value: LoyaltyConfig.get_level_benefits(level)
                for level in UserLevel
            }
        }), 200
        
    except Exception as e:
        logger.error(f"Error getting benefits: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500

@loyalty_bp.route('/history', methods=['GET'])
@token_required
def get_loyalty_history():
    """Get user's loyalty level history"""
    try:
        user_id = request.current_user.id
        
        history = LoyaltyHistory.query.filter_by(user_id=user_id)\
            .order_by(LoyaltyHistory.created_at.desc())\
            .limit(10)\
            .all()
            
        return jsonify({
            'history': [{
                'previous_level': h.previous_level,
                'new_level': h.new_level,
                'reason': h.reason,
                'date': h.created_at.isoformat()
            } for h in history]
        }), 200
        
    except Exception as e:
        logger.error(f"Error getting loyalty history: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500