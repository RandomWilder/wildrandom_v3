from flask import Blueprint, request, jsonify
from marshmallow import ValidationError
from src.shared.auth import token_required, admin_required
from src.prize_center_service.services import TemplateService, PoolService
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
@admin_prizes_bp.route('/pools', methods=['POST'])
@token_required
@admin_required
def create_pool():
    """Create new prize pool"""
    try:
        schema = PrizePoolCreateSchema()
        data = schema.load(request.get_json())
        
        pool, error = PoolService.create_pool(
            data=data,
            admin_id=request.current_user.id
        )
        if error:
            return jsonify({'error': error}), 400
            
        return jsonify(pool.to_dict()), 201
        
    except ValidationError as e:
        return jsonify({'error': e.messages}), 400
        
    except Exception as e:
        logger.error(f"Error creating pool: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500

@admin_prizes_bp.route('/pools/<int:pool_id>/allocate', methods=['POST'])
@token_required
@admin_required
def allocate_to_pool(pool_id):
    """Allocate prizes to pool"""
    try:
        schema = PrizePoolAllocationSchema()
        data = schema.load(request.get_json())
        
        instances, error = PoolService.allocate_template(
            pool_id=pool_id,
            data=data,
            admin_id=request.current_user.id
        )
        if error:
            return jsonify({'error': error}), 400
            
        return jsonify({
            'allocated_instances': [i.to_dict() for i in instances]
        }), 200
        
    except ValidationError as e:
        return jsonify({'error': e.messages}), 400
        
    except Exception as e:
        logger.error(f"Error allocating to pool: {str(e)}")
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