from flask import Blueprint, request, jsonify, current_app
from src.shared.auth import admin_required
from marshmallow import ValidationError
import logging
from src.raffle_service.services import (
    RaffleService, 
    TicketService,
    DrawService,
    StateService
)
from src.raffle_service.models import (
    RaffleStatus,
    RaffleState
)
from src.raffle_service.schemas import (
    RaffleCreateSchema,
    RaffleUpdateSchema,
    StatusUpdateSchema,
    DrawExecutionSchema
)

logger = logging.getLogger(__name__)

admin_bp = Blueprint('admin', __name__, url_prefix='/api/admin/raffles')

@admin_bp.route('/', methods=['POST'])
@admin_required
def create_raffle():
    """Create new raffle"""
    try:
        schema = RaffleCreateSchema()
        data = schema.load(request.get_json())
        
        raffle, error = RaffleService.create_raffle(
            data=data,
            admin_id=request.current_user.id
        )
        
        if error:
            logger.error(f"Error creating raffle: {error}")
            return jsonify({'error': error}), 400
            
        return jsonify(raffle), 201
        
    except ValidationError as e:
        logger.error(f"Validation error: {str(e.messages)}")
        return jsonify({'error': e.messages}), 400
    except Exception as e:
        logger.error(f"Unexpected error: {str(e)}", exc_info=True)
        return jsonify({'error': 'Internal server error'}), 500

@admin_bp.route('/<int:raffle_id>', methods=['PUT'])
@admin_required
def update_raffle(raffle_id):
    """Update raffle details"""
    try:
        schema = RaffleUpdateSchema()
        data = schema.load(request.get_json())

        raffle, error = RaffleService.update_raffle(
            raffle_id=raffle_id,
            data=data,
            admin_id=request.current_user.id
        )

        if error:
            return jsonify({'error': error}), 400

        return jsonify(raffle.to_dict()), 200

    except ValidationError as e:
        return jsonify({'error': e.messages}), 400
    except Exception as e:
        logger.error(f"Error updating raffle: {str(e)}", exc_info=True)
        return jsonify({'error': 'Internal server error'}), 500

@admin_bp.route('/<int:raffle_id>/status', methods=['PUT'])
@admin_required
def update_status(raffle_id):
    """Update raffle status"""
    try:
        logger.debug(f"Starting status update for raffle {raffle_id}")
        schema = StatusUpdateSchema()
        data = schema.load(request.get_json())
        
        logger.info(f"Updating raffle {raffle_id} status to {data['status']}")
        
        updated_raffle, error = StateService.update_status(
            raffle_id=raffle_id,
            new_status=data['status'],
            admin_id=request.current_user.id,
            reason=data.get('reason')
        )
        
        if error:
            logger.error(f"Status update failed: {error}")
            return jsonify({'error': error}), 400
            
        if not updated_raffle:
            logger.error("No raffle returned from update operation")
            return jsonify({'error': 'Failed to update raffle status'}), 500
            
        logger.info(f"Successfully updated raffle {raffle_id} status")
        return jsonify(updated_raffle.to_dict()), 200
        
    except ValidationError as e:
        logger.error(f"Validation error: {str(e)}")
        return jsonify({'error': str(e)}), 400
    except Exception as e:
        logger.error(f"Unexpected error in status update: {str(e)}", exc_info=True)
        return jsonify({'error': str(e)}), 500

@admin_bp.route('/<int:raffle_id>/draw', methods=['POST'])
@admin_required
def execute_draw(raffle_id):
    """Execute raffle draw"""
    try:
        schema = DrawExecutionSchema()
        data = schema.load(request.get_json())
        
        if data.get('draw_count', 1) > 1:
            draws, error = DrawService.execute_multiple_draws(
                raffle_id=raffle_id,
                admin_id=request.current_user.id,
                number_of_draws=data['draw_count']
            )
        else:
            draw, error = DrawService.execute_draw(
                raffle_id=raffle_id,
                admin_id=request.current_user.id
            )
            draws = [draw] if draw else []
            
        if error:
            return jsonify({'error': error}), 400
            
        return jsonify([d.to_dict() for d in draws]), 200
        
    except ValidationError as e:
        return jsonify({'error': e.messages}), 400
    except Exception as e:
        logger.error(f"Error executing draw: {str(e)}", exc_info=True)
        return jsonify({'error': 'Internal server error'}), 500

@admin_bp.route('/<int:raffle_id>/stats', methods=['GET'])
@admin_required
def get_raffle_stats(raffle_id):
    """Get detailed raffle statistics"""
    try:
        stats, error = RaffleService.get_raffle_stats(raffle_id)
        if error:
            return jsonify({'error': error}), 400
            
        # Get ticket stats
        ticket_stats, error = TicketService.get_raffle_statistics(raffle_id)
        if error:
            return jsonify({'error': error}), 400
            
        stats.update(ticket_stats)
        
        # Get state history
        history, error = StateService.get_state_history(raffle_id)
        if error:
            return jsonify({'error': error}), 400
            
        stats['state_history'] = history
        
        return jsonify(stats), 200
        
    except Exception as e:
        logger.error(f"Error getting stats: {str(e)}", exc_info=True)
        return jsonify({'error': 'Internal server error'}), 500

@admin_bp.route('/<int:raffle_id>/tickets', methods=['GET'])
@admin_required
def list_tickets(raffle_id):
    """List all tickets for a raffle"""
    try:
        status = request.args.get('status')
        user_id = request.args.get('user_id', type=int)
        revealed = request.args.get('revealed', type=bool)
        
        filters = {
            'status': status,
            'user_id': user_id,
            'revealed': revealed
        }
        
        # Remove None values
        filters = {k: v for k, v in filters.items() if v is not None}
        
        tickets, error = TicketService.get_tickets_by_filters(raffle_id, filters)
        if error:
            return jsonify({'error': error}), 400
            
        return jsonify([t.to_dict() for t in tickets]), 200
        
    except Exception as e:
        logger.error(f"Error listing tickets: {str(e)}", exc_info=True)
        return jsonify({'error': 'Internal server error'}), 500

@admin_bp.route('/tickets/<int:ticket_id>/void', methods=['POST'])
@admin_required
def void_ticket(ticket_id):
    """Void a ticket"""
    try:
        data = request.get_json()
        reason = data.get('reason', 'Administrative action')
        
        ticket, error = TicketService.void_ticket(
            ticket_id=ticket_id,
            admin_id=request.current_user.id,
            reason=reason
        )
        
        if error:
            return jsonify({'error': error}), 400
            
        return jsonify(ticket.to_dict()), 200
        
    except Exception as e:
        logger.error(f"Error voiding ticket: {str(e)}", exc_info=True)
        return jsonify({'error': 'Internal server error'}), 500

@admin_bp.route('/validate-states', methods=['POST'])
@admin_required
def validate_states():
    """Validate states for all active raffles"""
    try:
        results = []
        active_raffles = RaffleService.get_active_raffles()[0]
        
        for raffle in active_raffles:
            is_valid, error = StateService.validate_state(raffle.id)
            results.append({
                'raffle_id': raffle.id,
                'title': raffle.title,
                'is_valid': is_valid,
                'error': error
            })
            
        return jsonify(results), 200
        
    except Exception as e:
        logger.error(f"Error validating states: {str(e)}", exc_info=True)
        return jsonify({'error': 'Internal server error'}), 500
    
@admin_bp.route('/test', methods=['GET'])
@admin_required
def test_route():
    """Test route to verify admin endpoint accessibility"""
    return jsonify({"message": "Admin routes accessible"}), 200