#src/prize_center_service/routes/admin_routes.py

from flask import Blueprint, request, jsonify
from marshmallow import ValidationError
from src.shared.auth import token_required, admin_required
from src.prize_center_service.services import TemplateService, PoolService
from src.prize_center_service.models import PrizePool, PrizeInstance
from src.prize_center_service.schemas import (
    PrizeTemplateCreateSchema,
    PrizeTemplateUpdateSchema,
    PrizePoolCreateSchema,
    PrizePoolAllocationSchema
)
import logging

logger = logging.getLogger(__name__)

admin_prizes_bp = Blueprint('admin_prizes', __name__, url_prefix='/api/admin/prizes')

# Template Routes
@admin_prizes_bp.route('/templates', methods=['POST'])
@token_required
@admin_required
def create_template():
    """Create new prize template"""
    try:
        schema = PrizeTemplateCreateSchema()
        data = schema.load(request.get_json())
        
        template, error = TemplateService.create_template(
            data=data,
            admin_id=request.current_user.id
        )
        if error:
            return jsonify({'error': error}), 400
            
        return jsonify(template.to_dict()), 201
        
    except ValidationError as e:
        return jsonify({'error': e.messages}), 400
        
    except Exception as e:
        logger.error(f"Error creating template: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500

@admin_prizes_bp.route('/templates', methods=['GET'])
@token_required
@admin_required
def list_templates():
    """List prize templates"""
    try:
        filters = request.args.to_dict()
        templates, error = TemplateService.list_templates(filters)
        if error:
            return jsonify({'error': error}), 400
            
        return jsonify({
            'templates': [t.to_dict() for t in templates]
        }), 200
        
    except Exception as e:
        logger.error(f"Error listing templates: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500

@admin_prizes_bp.route('/templates/<int:template_id>', methods=['GET'])
@token_required
@admin_required
def get_template(template_id):
    """Get prize template details"""
    try:
        template, error = TemplateService.get_template(template_id)
        if error:
            return jsonify({'error': error}), 404
            
        return jsonify(template.to_dict()), 200
        
    except Exception as e:
        logger.error(f"Error getting template: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500

@admin_prizes_bp.route('/templates/<int:template_id>', methods=['PUT'])
@token_required
@admin_required
def update_template(template_id):
    """Update prize template"""
    try:
        schema = PrizeTemplateUpdateSchema()
        data = schema.load(request.get_json())
        
        template, error = TemplateService.update_template(
            template_id=template_id,
            data=data
        )
        if error:
            return jsonify({'error': error}), 400
            
        return jsonify(template.to_dict()), 200
        
    except ValidationError as e:
        return jsonify({'error': e.messages}), 400
        
    except Exception as e:
        logger.error(f"Error updating template: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500

# Pool Routes

@admin_prizes_bp.route('/pools', methods=['GET'])
@token_required
@admin_required
def list_pools():
    """
    List all prize pools with comprehensive administrative details.
    
    Returns:
        200: JSON response with complete pool listing
        500: Error response if database operation fails
        
    Response Format:
        {
            "pools": [
                {
                    "id": int,
                    "name": string,
                    "description": string,
                    "status": "unlocked" | "locked" | "used",
                    "total_instances": int,
                    "instant_win_instances": int,
                    "draw_win_instances": int,
                    "values": {
                        "retail_total": float,
                        "cash_total": float,
                        "credit_total": float
                    },
                    "total_odds": float,
                    "locked_at": string | null,
                    "created_at": string
                }
            ],
            "total_pools": int,
            "active_pools": int
        }
    """
    try:
        logger.info("Admin requesting complete pool listing")
        
        # Query all pools with optimized loading
        pools = PrizePool.query.order_by(PrizePool.created_at.desc()).all()
        
        # Calculate summary metrics
        active_pools = sum(1 for pool in pools if pool.status != 'used')
        
        response_data = {
            "pools": [pool.to_dict() for pool in pools],
            "total_pools": len(pools),
            "active_pools": active_pools
        }
        
        logger.debug(f"Returning {len(pools)} pools to admin")
        return jsonify(response_data), 200
        
    except Exception as e:
        logger.error(f"Error listing pools: {str(e)}", exc_info=True)
        return jsonify({'error': 'Internal server error'}), 500

@admin_prizes_bp.route('/pools/<int:pool_id>', methods=['GET'])
@token_required
@admin_required
def get_pool(pool_id):
    """Get pool details"""
    try:
        pool = PrizePool.query.get_or_404(pool_id)
        return jsonify(pool.to_dict()), 200
    except Exception as e:
        logger.error(f"Error getting pool: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500

@admin_prizes_bp.route('/pools', methods=['POST'])
@token_required
@admin_required
def create_pool():
    """Create new prize pool"""
    try:
        schema = PrizePoolCreateSchema()
        data = schema.load(request.get_json())
        
        logger.info(f"Creating new prize pool with data: {data}")
        logger.debug(f"Request made by admin_id: {request.current_user.id}")
        
        # Check for existing pool first
        existing_pool = PoolService.get_pool_by_name(data['name'])
        if existing_pool:
            logger.warning(f"Attempted to create duplicate pool name: {data['name']}")
            return jsonify({
                'error': f"Pool with name '{data['name']}' already exists",
                'pool_id': existing_pool.id
            }), 409
        
        pool, error = PoolService.create_pool(
            data=data,
            admin_id=request.current_user.id
        )
        
        if error:
            logger.error(f"Failed to create pool: {error}")
            return jsonify({'error': error}), 400
            
        logger.info(f"Successfully created pool: {pool.id} - {pool.name}")
        return jsonify(pool.to_dict()), 201
        
    except ValidationError as e:
        logger.error(f"Validation error creating pool: {e.messages}")
        return jsonify({'error': e.messages}), 400
        
    except Exception as e:
        logger.error(f"Unexpected error creating pool: {str(e)}", exc_info=True)
        return jsonify({'error': str(e)}), 500

@admin_prizes_bp.route('/pools/<int:pool_id>/allocate', methods=['POST'])
@token_required
@admin_required
def allocate_to_pool(pool_id):
    """Allocate prizes to pool"""
    try:
        schema = PrizePoolAllocationSchema()
        data = schema.load(request.get_json())
        
        logger.info(f"Allocating templates to pool {pool_id} with data: {data}")
        logger.debug(f"Allocation requested by admin_id: {request.current_user.id}")
        
        instances, error = PoolService.allocate_template(
            pool_id=pool_id,
            data=data,
            admin_id=request.current_user.id
        )
        
        if error:
            logger.error(f"Failed to allocate templates: {error}")
            return jsonify({'error': error}), 400
            
        if not instances:
            logger.warning(f"No instances created for pool {pool_id}")
            return jsonify({'error': 'No instances were created'}), 400
            
        logger.info(f"Successfully allocated {len(instances)} instances to pool {pool_id}")
        
        # Updated response handling to manage both instance types
        instance_list = []
        for instance in instances:
            instance_data = {
                'instance_id': instance.instance_id,
                'instance_type': instance.instance_type,  # Add instance type to response
                'values': {
                    'retail': float(instance.retail_value),
                    'cash': float(instance.cash_value),
                    'credit': float(instance.credit_value)
                }
            }
            
            # Add type-specific attributes
            if hasattr(instance, 'individual_odds'):
                instance_data['individual_odds'] = float(instance.individual_odds)
                instance_data['collective_odds'] = float(instance.collective_odds)
            elif hasattr(instance, 'distribution_type'):
                instance_data['distribution_type'] = instance.distribution_type.value
                
            instance_list.append(instance_data)
        
        return jsonify({
            'allocated_instances': instance_list,
            'pool_updated_totals': {
                'total_instances': instances[0].pool.total_instances,
                'instant_win_instances': instances[0].pool.instant_win_instances,
                'draw_win_instances': instances[0].pool.draw_win_instances,
                'total_odds': instances[0].pool.total_odds,
                'values': {
                    'retail_total': float(instances[0].pool.retail_total),
                    'cash_total': float(instances[0].pool.cash_total),
                    'credit_total': float(instances[0].pool.credit_total)
                }
            }
        }), 200
        
    except ValidationError as e:
        logger.error(f"Validation error in allocation: {e.messages}")
        return jsonify({'error': e.messages}), 400
        
    except Exception as e:
        logger.error(f"Unexpected error in allocation: {str(e)}", exc_info=True)
        return jsonify({'error': str(e)}), 500

@admin_prizes_bp.route('/pools/<int:pool_id>/instances', methods=['GET'])
@token_required
@admin_required
def list_pool_instances(pool_id: int):
    """
    List all prize instances in a pool with comprehensive details.
    
    Query Parameters:
        status: Optional[str] - Filter by instance status
        type: Optional[str] - Filter by instance type (instant_win/draw_win)
        page: Optional[int] - Page number for pagination
        per_page: Optional[int] = 50 - Items per page
        
    Returns:
        200: JSON response with instances listing
        404: If pool not found
        500: On server error
    """
    try:
        # Verify pool exists
        pool = PrizePool.query.get_or_404(pool_id)
        
        # Build query with filters
        query = PrizeInstance.query.filter_by(pool_id=pool_id)
        
        if status := request.args.get('status'):
            query = query.filter_by(status=status)
            
        if instance_type := request.args.get('type'):
            query = query.filter_by(instance_type=instance_type)
            
        # Add pagination
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 50, type=int)
        pagination = query.paginate(page=page, per_page=per_page)
        
        response_data = {
            "pool_id": pool_id,
            "total_instances": pagination.total,
            "page": page,
            "pages": pagination.pages,
            "instances": [{
                "instance_id": instance.instance_id,
                "type": instance.instance_type,
                "status": instance.status,
                "values": {
                    "retail": float(instance.retail_value),
                    "cash": float(instance.cash_value),
                    "credit": float(instance.credit_value)
                },
                "template_id": instance.template_id,
                "discovery_info": {
                    "ticket_id": instance.discovering_ticket_id,
                    "time": instance.discovery_time.isoformat() if instance.discovery_time else None
                } if instance.discovering_ticket_id else None,
                "claim_info": {
                    "claimed_by": instance.claimed_by_id,
                    "claimed_at": instance.claimed_at.isoformat() if instance.claimed_at else None,
                    "transaction_id": instance.claim_transaction_id
                } if instance.claimed_by_id else None,
                "created_at": instance.created_at.isoformat()
            } for instance in pagination.items],
            "summary": {
                "available": query.filter_by(status="AVAILABLE").count(),
                "discovered": query.filter_by(status="DISCOVERED").count(),
                "claimed": query.filter_by(status="CLAIMED").count(),
                "expired": query.filter_by(status="EXPIRED").count(),
                "voided": query.filter_by(status="VOIDED").count()
            }
        }
        
        return jsonify(response_data), 200
        
    except Exception as e:
        logger.error(f"Error listing pool instances: {str(e)}", exc_info=True)
        return jsonify({'error': 'Internal server error'}), 500

@admin_prizes_bp.route('/pools/<int:pool_id>/lock', methods=['PUT'])
@token_required
@admin_required
def lock_pool(pool_id):
    """Lock prize pool"""
    try:
        result, error = PoolService.lock_pool(
            pool_id=pool_id,
            admin_id=request.current_user.id
        )
        if error:
            return jsonify({'error': error}), 400
            
        return jsonify(result), 200
        
    except Exception as e:
        logger.error(f"Error locking pool: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500