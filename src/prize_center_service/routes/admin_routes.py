from flask import Blueprint, request, jsonify
from marshmallow import ValidationError
from src.shared.auth import token_required, admin_required
from src.prize_center_service.services import TemplateService, PoolService
from src.prize_center_service.models import PrizePool
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