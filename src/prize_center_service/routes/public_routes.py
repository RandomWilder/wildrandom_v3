from flask import Blueprint, request, jsonify
from src.prize_center_service.services import PoolService, InstanceService
import logging

logger = logging.getLogger(__name__)

public_prizes_bp = Blueprint('public_prizes', __name__, url_prefix='/api/prizes')

@public_prizes_bp.route('/pools', methods=['GET'])
def list_public_pools():
    """List active prize pools"""
    try:
        pools, error = PoolService.list_active_pools()
        if error:
            return jsonify({'error': error}), 400
            
        return jsonify({
            'pools': [p.to_dict() for p in pools]
        }), 200
        
    except Exception as e:
        logger.error(f"Error listing public pools: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500

@public_prizes_bp.route('/pools/<int:pool_id>', methods=['GET'])
def get_public_pool(pool_id):
    """Get public pool details"""
    try:
        pool, error = PoolService.get_pool(pool_id)
        if error:
            return jsonify({'error': error}), 404
            
        return jsonify(pool.to_dict()), 200
        
    except Exception as e:
        logger.error(f"Error getting public pool: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500