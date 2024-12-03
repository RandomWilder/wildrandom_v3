from flask import Blueprint, request, jsonify
from src.shared.auth import token_required
from src.prize_center_service.services import PoolService, InstanceService
from src.payment_service.services import PaymentService
from datetime import datetime, timezone
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
    
@public_prizes_bp.route('/claim/<string:instance_id>', methods=['POST'])
@token_required
def claim_prize(instance_id: str):
    """Claim a discovered prize"""
    try:
        data = request.get_json()
        logger.debug(f"Claiming prize {instance_id} with data: {data}")
        
        if not data or 'value_type' not in data:
            return jsonify({'error': 'Value type must be specified'}), 400
            
        value_type = data['value_type']
        if value_type not in ['credit', 'cash', 'retail']:
            return jsonify({'error': 'Invalid value type'}), 400

        # Attempt to claim prize
        instance, transaction, error = InstanceService.claim_prize(
            instance_id=instance_id,
            user_id=request.current_user.id,
            value_type=value_type
        )

        if error:
            logger.error(f"Prize claim failed: {error}")
            return jsonify({'error': error}), 400

        return jsonify({
            'message': 'Prize claimed successfully',
            'prize': {
                'instance_id': instance.instance_id,
                'type': instance.instance_type,
                'claimed_value': {
                    'type': value_type,
                    'amount': float(transaction.amount)
                },
                'claim_time': instance.claimed_at.isoformat()
            },
            'transaction': {
                'id': transaction.id,
                'amount': float(transaction.amount),
                'status': transaction.status,
                'created_at': transaction.created_at.isoformat()
            }
        }), 200

    except Exception as e:
        logger.error(f"Error claiming prize: {str(e)}", exc_info=True)
        return jsonify({'error': 'Internal server error'}), 500