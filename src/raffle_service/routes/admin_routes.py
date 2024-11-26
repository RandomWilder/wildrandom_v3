from flask import Blueprint, request, jsonify, current_app
from src.shared.auth import admin_required
from marshmallow import ValidationError
import logging
from datetime import datetime, timezone
from src.raffle_service.services import (
    RaffleService, 
    TicketService,
    DrawService,
    StateService
)
from src.raffle_service.models import (
    RaffleStatus,
    RaffleState,
    Raffle
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

@admin_bp.route('/<int:raffle_id>', methods=['GET'])
@admin_required
def get_raffle(raffle_id):
    """Get raffle details"""
    try:
        logger.info(f"Admin request to get raffle {raffle_id}")
        
        raffle, error = RaffleService.get_raffle(raffle_id)
        
        if error:
            logger.error(f"Error retrieving raffle {raffle_id}: {error}")
            return jsonify({'error': error}), 404 if "not found" in error.lower() else 500
            
        if not raffle:
            logger.error(f"No raffle returned but also no error for ID {raffle_id}")
            return jsonify({'error': 'Raffle retrieval failed'}), 500
            
        # Convert to dict and verify the conversion
        try:
            raffle_data = raffle.to_dict()
            logger.info(f"Successfully retrieved raffle {raffle_id}")
            return jsonify(raffle_data), 200
            
        except Exception as dict_error:
            logger.error(f"Error converting raffle to dict: {str(dict_error)}", exc_info=True)
            return jsonify({'error': 'Error preparing raffle data'}), 500
        
    except Exception as e:
        logger.error(f"Unexpected error getting raffle {raffle_id}: {str(e)}", exc_info=True)
        return jsonify({'error': f"Unexpected error: {str(e)}"}), 500

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
        # Get filter parameters
        status = request.args.get('status')
        user_id = request.args.get('user_id', type=int)
        revealed = request.args.get('revealed', type=bool)
        instant_win = request.args.get('instant_win', type=bool)
        limit = request.args.get('limit', type=int)
        
        # Build filters dictionary
        filters = {k: v for k, v in {
            'status': status,
            'user_id': user_id,
            'revealed': revealed,
            'instant_win_eligible': instant_win
        }.items() if v is not None}
        
        # Get tickets with filters
        tickets, error = TicketService.get_tickets_by_filters(
            raffle_id=raffle_id,
            filters=filters,
            limit=limit
        )
        
        if error:
            return jsonify({'error': error}), 400
            
        # Convert tickets to dictionary format
        tickets_data = []
        for ticket in tickets:
            ticket_dict = ticket.to_dict()
            # Add any additional related data if needed
            tickets_data.append(ticket_dict)
            
        return jsonify({
            'total': len(tickets_data),
            'tickets': tickets_data
        }), 200
        
    except Exception as e:
        logger.error(f"Error listing tickets: {str(e)}", exc_info=True)
        return jsonify({'error': str(e)}), 500

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

@admin_bp.route('/<int:raffle_id>/debug-state', methods=['GET'])
@admin_required
def debug_raffle_state(raffle_id):
    """Debug raffle state calculation"""
    try:
        raffle = Raffle.query.get(raffle_id)
        if not raffle:
            return jsonify({'error': 'Raffle not found'}), 404

        current_time = datetime.now(timezone.utc)
        start_time = raffle.start_time.replace(tzinfo=timezone.utc) if raffle.start_time.tzinfo is None else raffle.start_time
        end_time = raffle.end_time.replace(tzinfo=timezone.utc) if raffle.end_time.tzinfo is None else raffle.end_time

        return jsonify({
            'current_time': current_time.isoformat(),
            'start_time': start_time.isoformat(),
            'end_time': end_time.isoformat(),
            'current_state': raffle.state,
            'status': raffle.status,
            'time_checks': {
                'current_vs_start': str(current_time - start_time),
                'current_vs_end': str(current_time - end_time),
                'is_past_start': current_time >= start_time,
                'is_before_end': current_time < end_time
            }
        }), 200

    except Exception as e:
        logger.error(f"Error in debug state: {str(e)}")
        return jsonify({'error': str(e)}), 500