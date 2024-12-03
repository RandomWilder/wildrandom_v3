"""
Admin Routes Module

Provides comprehensive administrative endpoints for raffle management including:
- Raffle lifecycle management (creation, updates, state transitions)
- Draw execution and prize management
- Ticket operations and monitoring
- System maintenance and debugging
"""

from flask import Blueprint, request, jsonify, current_app
from src.shared.auth import admin_required, token_required
from marshmallow import ValidationError
import logging
from datetime import datetime, timezone, timedelta
from typing import Dict, Any, Optional, List, Tuple
from src.raffle_service.services import (
    RaffleService,
    TicketService,
    DrawService,
    StateService,
    ReservationService
)
from src.raffle_service.models import (
    Ticket,
    TicketStatus,
    TicketReservation,
    ReservationStatus,
    RaffleStatus,
    RaffleState,
    Raffle,
    RaffleHistory
)
from src.raffle_service.schemas import (
    RaffleCreateSchema,
    RaffleUpdateSchema,
    StatusUpdateSchema,
    StateUpdateSchema,
    DrawExecutionSchema
)
from src.shared import db
from sqlalchemy import func

# Configure logging
logger = logging.getLogger(__name__)

# Create blueprint
admin_bp = Blueprint('admin', __name__, url_prefix='/api/admin/raffles')

@admin_bp.route('/', methods=['POST'])
@token_required
@admin_required
def create_raffle():
    """
    Create new raffle with comprehensive validation.
    
    Returns:
        tuple: (response_json, status_code)
    """
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
            
        logger.info(f"Successfully created raffle {raffle['id']}")
        return jsonify(raffle), 201
        
    except ValidationError as e:
        logger.error(f"Validation error: {str(e.messages)}")
        return jsonify({'error': e.messages}), 400
    except Exception as e:
        logger.error(f"Unexpected error: {str(e)}", exc_info=True)
        return jsonify({'error': 'Internal server error'}), 500

@admin_bp.route('/<int:raffle_id>', methods=['GET'])
@token_required
@admin_required
def get_raffle(raffle_id: int):
    """
    Get detailed raffle information.
    
    Args:
        raffle_id: ID of raffle to retrieve
        
    Returns:
        tuple: (response_json, status_code)
    """
    try:
        logger.info(f"Admin request to get raffle {raffle_id}")
        
        raffle, error = RaffleService.get_raffle(raffle_id)
        if error:
            logger.error(f"Error retrieving raffle {raffle_id}: {error}")
            return jsonify({'error': error}), 404 if "not found" in error.lower() else 500
            
        if not raffle:
            logger.error(f"No raffle returned but also no error for ID {raffle_id}")
            return jsonify({'error': 'Raffle retrieval failed'}), 500
            
        logger.info(f"Successfully retrieved raffle {raffle_id}")
        return jsonify(raffle.to_dict()), 200
        
    except Exception as e:
        logger.error(f"Unexpected error getting raffle {raffle_id}: {str(e)}", exc_info=True)
        return jsonify({'error': f"Unexpected error: {str(e)}"}), 500

@admin_bp.route('/<int:raffle_id>', methods=['PUT'])
@token_required
@admin_required
def update_raffle(raffle_id: int):
    """
    Update raffle configuration.
    
    Args:
        raffle_id: ID of raffle to update
        
    Returns:
        tuple: (response_json, status_code)
    """
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
            
        logger.info(f"Successfully updated raffle {raffle_id}")
        return jsonify(raffle.to_dict()), 200
        
    except ValidationError as e:
        return jsonify({'error': e.messages}), 400
    except Exception as e:
        logger.error(f"Error updating raffle: {str(e)}", exc_info=True)
        return jsonify({'error': 'Internal server error'}), 500

@admin_bp.route('/<int:raffle_id>/status', methods=['PUT'])
@token_required
@admin_required
def update_status(raffle_id: int):
    """
    Update raffle status with state validation.
    
    Args:
        raffle_id: ID of raffle to update
        
    Returns:
        tuple: (response_json, status_code)
    """
    try:
        schema = StatusUpdateSchema()
        data = schema.load(request.get_json())
        
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

@admin_bp.route('/<int:raffle_id>/state', methods=['PUT'])
@token_required
@admin_required
def update_raffle_state(raffle_id: int):
    """Update raffle state with validation"""
    try:
        schema = StateUpdateSchema()
        data = schema.load(request.get_json())
        
        updated_raffle, error = StateService.update_state(
            raffle_id=raffle_id,
            new_state=data['state'],
            admin_id=request.current_user.id,
            reason=data.get('reason')
        )
        
        if error:
            return jsonify({'error': error}), 400
            
        return jsonify(updated_raffle.to_dict()), 200
        
    except ValidationError as e:
        return jsonify({'error': e.messages}), 400

@admin_bp.route('/<int:raffle_id>/execute-draw', methods=['POST'])
@token_required
@admin_required
def execute_raffle_draw(raffle_id: int):
    """
    Execute all draws for a raffle based on prize pool configuration.
    
    Args:
        raffle_id: ID of raffle to execute draws for
        
    Returns:
        tuple: (response_json, status_code)
    """
    try:
        draws, error = DrawService.execute_raffle_draws(
            raffle_id=raffle_id,
            admin_id=request.current_user.id
        )
        
        if error:
            logger.error(f"Draw execution failed: {error}")
            return jsonify({'error': error}), 400
            
        if not draws:
            return jsonify({
                'message': 'No draws executed',
                'reason': 'No eligible tickets or available prizes'
            }), 200
            
        response_data = {
            'message': f'Successfully executed {len(draws)} draws',
            'draws': [draw.to_dict() for draw in draws]
        }
        
        logger.info(f"Successfully executed {len(draws)} draws for raffle {raffle_id}")
        return jsonify(response_data), 200
        
    except Exception as e:
        logger.error(f"Error executing draw: {str(e)}", exc_info=True)
        return jsonify({'error': 'Internal server error'}), 500

@admin_bp.route('/<int:raffle_id>/prizes', methods=['GET'])
@token_required
@admin_required
def get_raffle_prizes(raffle_id: int):
    """
    Get prize configuration and status for a raffle.
    
    Args:
        raffle_id: ID of raffle to get prizes for
        
    Returns:
        tuple: (response_json, status_code)
    """
    try:
        raffle = Raffle.query.get(raffle_id)
        if not raffle:
            return jsonify({'error': 'Raffle not found'}), 404
            
        prize_pool = raffle.prize_pool
        if not prize_pool:
            return jsonify({'error': 'No prize pool assigned'}), 400
            
        response_data = {
            'prize_pool_id': prize_pool.id,
            'total_prizes': prize_pool.total_instances,
            'instant_win_prizes': prize_pool.instant_win_instances,
            'draw_win_prizes': prize_pool.draw_win_instances,
            'total_value': {
                'retail': float(prize_pool.retail_total),
                'cash': float(prize_pool.cash_total),
                'credit': float(prize_pool.credit_total)
            },
            'prizes': [
                instance.to_dict() 
                for instance in prize_pool.instances.all()
            ]
        }
        
        return jsonify(response_data), 200
        
    except Exception as e:
        logger.error(f"Error getting prizes: {str(e)}", exc_info=True)
        return jsonify({'error': 'Internal server error'}), 500

@admin_bp.route('/<int:raffle_id>/tickets', methods=['GET'])
@token_required
@admin_required
def list_tickets(raffle_id: int):
    """
    List all tickets for a raffle with filtering options.
    
    Args:
        raffle_id: ID of raffle to list tickets for
        
    Query Parameters:
        status: Filter by ticket status
        user_id: Filter by user ID
        revealed: Filter by reveal status
        instant_win: Filter by instant win eligibility
        
    Returns:
        tuple: (response_json, status_code)
    """
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
            
        return jsonify({
            'total': len(tickets),
            'tickets': [ticket.to_dict() for ticket in tickets]
        }), 200
        
    except Exception as e:
        logger.error(f"Error listing tickets: {str(e)}", exc_info=True)
        return jsonify({'error': str(e)}), 500

@admin_bp.route('/tickets/<string:ticket_id>/void', methods=['POST'])
@token_required
@admin_required
def void_ticket(ticket_id: str):
    """
    Void a ticket and handle related resources.
    
    Args:
        ticket_id: ID of ticket to void
        
    Returns:
        tuple: (response_json, status_code)
    """
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

@admin_bp.route('/<int:raffle_id>/stats', methods=['GET'])
@token_required
@admin_required
def get_raffle_stats(raffle_id: int):
    """
    Get comprehensive raffle statistics.
    
    Args:
        raffle_id: ID of raffle to get stats for
        
    Returns:
        tuple: (response_json, status_code)
    """
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

@admin_bp.route('/validate-states', methods=['POST'])
@token_required
@admin_required
def validate_states():
    """
    Validate states for all active raffles.
    
    Returns:
        tuple: (response_json, status_code)
        
    Validates:
        - State consistency
        - Timing alignment
        - Prize pool integrity
    """
    try:
        results = []
        active_raffles = RaffleService.get_active_raffles()[0]
        
        for raffle in active_raffles:
            is_valid, error = StateService.validate_state(raffle.id)
            results.append({
                'raffle_id': raffle.id,
                'title': raffle.title,
                'is_valid': is_valid,
                'error': error,
                'current_state': raffle.state,
                'current_status': raffle.status,
                'timing': {
                    'start_time': raffle.start_time.isoformat(),
                    'end_time': raffle.end_time.isoformat(),
                    'current_time': datetime.now(timezone.utc).isoformat()
                }
            })
        
        return jsonify(results), 200
        
    except Exception as e:
        logger.error(f"Error validating states: {str(e)}", exc_info=True)
        return jsonify({'error': 'Internal server error'}), 500

@admin_bp.route('/<int:raffle_id>/debug-state', methods=['GET'])
@token_required
@admin_required
def debug_raffle_state(raffle_id: int):
    """
    Debug raffle state calculation with detailed timing analysis.
    
    Args:
        raffle_id: ID of raffle to debug
        
    Returns:
        tuple: (response_json, status_code)
    """
    try:
        raffle = Raffle.query.get(raffle_id)
        if not raffle:
            return jsonify({'error': 'Raffle not found'}), 404
            
        current_time = datetime.now(timezone.utc)
        start_time = raffle.start_time.replace(tzinfo=timezone.utc)
        end_time = raffle.end_time.replace(tzinfo=timezone.utc)
        
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
            },
            'state_transitions': {
                'scheduled_transitions': raffle.history.count(),
                'last_transition': raffle.history.order_by(
                    RaffleHistory.created_at.desc()
                ).first().to_dict() if raffle.history.count() > 0 else None
            }
        }), 200
        
    except Exception as e:
        logger.error(f"Error in debug state: {str(e)}")
        return jsonify({'error': str(e)}), 500

@admin_bp.route('/cleanup-reservations', methods=['POST'])
@token_required
@admin_required
def force_cleanup():
    """
    Force cleanup of expired reservations.
    
    Returns:
        tuple: (response_json, status_code)
        
    Handles:
        - Expired ticket reservations
        - Orphaned tickets
        - Inconsistent states
    """
    try:
        logger.info("Starting manual cleanup of expired reservations")
        
        cleanup_results = {
            'reservations_cleaned': 0,
            'tickets_released': 0,
            'errors': []
        }
        
        # Cleanup expired reservations
        try:
            cleaned_count = ReservationService.cleanup_expired_reservations()
            cleanup_results['reservations_cleaned'] = cleaned_count
        except Exception as e:
            cleanup_results['errors'].append(f"Reservation cleanup error: {str(e)}")
            
        # Cleanup orphaned tickets
        try:
            tickets_count = ReservationService.cleanup_orphaned_tickets()
            cleanup_results['tickets_released'] = tickets_count
        except Exception as e:
            cleanup_results['errors'].append(f"Ticket cleanup error: {str(e)}")
            
        return jsonify({
            'message': 'Cleanup completed',
            'results': cleanup_results
        }), 200
        
    except Exception as e:
        logger.error(f"Manual cleanup failed: {str(e)}")
        return jsonify({'error': 'Cleanup failed'}), 500

@admin_bp.route('/check-reservations', methods=['GET'])
@token_required
@admin_required
def check_reservations():
    """
    Check reservation status with detailed analysis.
    
    Returns:
        tuple: (response_json, status_code)
        
    Provides:
        - Active reservations
        - Expiration timing
        - Resource allocation
    """
    try:
        # Query reservations
        now = datetime.now(timezone.utc)
        reservations = TicketReservation.query.filter(
            TicketReservation.status == ReservationStatus.PENDING
        ).all()
        
        data = []
        for res in reservations:
            data.append({
                'id': res.id,
                'user_id': res.user_id,
                'raffle_id': res.raffle_id,
                'status': res.status,
                'expires_at': res.expires_at.isoformat() if res.expires_at else None,
                'is_expired': res.expires_at <= now if res.expires_at else None,
                'ticket_ids': res.ticket_ids,
                'total_amount': float(res.total_amount),
                'created_at': res.created_at.isoformat(),
                'time_until_expiry': str(res.expires_at - now) if res.expires_at else None
            })
            
        return jsonify({
            'total': len(data),
            'reservations': data,
            'current_time': now.isoformat(),
            'system_status': {
                'active_reservations': len(data),
                'total_tickets_reserved': sum(len(r['ticket_ids']) for r in data),
                'total_value_reserved': sum(r['total_amount'] for r in data)
            }
        }), 200
        
    except Exception as e:
        logger.error(f"Error checking reservations: {str(e)}")
        return jsonify({'error': str(e)}), 500

@admin_bp.route('/check-reserved-tickets', methods=['GET'])
@token_required
@admin_required
def check_reserved_tickets():
    """
    Check for tickets in reserved status with timing analysis.
    
    Returns:
        tuple: (response_json, status_code)
    """
    try:
        reserved_tickets = Ticket.query.filter_by(
            status=TicketStatus.RESERVED.value
        ).all()
        
        return jsonify({
            'total': len(reserved_tickets),
            'tickets': [t.to_dict() for t in reserved_tickets],
            'current_time': datetime.now(timezone.utc).isoformat(),
            'analysis': {
                'tickets_by_raffle': db.session.query(
                    Ticket.raffle_id,
                    func.count(Ticket.id)
                ).filter_by(
                    status=TicketStatus.RESERVED.value
                ).group_by(Ticket.raffle_id).all(),
                'tickets_by_user': db.session.query(
                    Ticket.user_id,
                    func.count(Ticket.id)
                ).filter_by(
                    status=TicketStatus.RESERVED.value
                ).group_by(Ticket.user_id).all()
            }
        }), 200
        
    except Exception as e:
        logger.error(f"Error checking reserved tickets: {str(e)}")
        return jsonify({'error': str(e)}), 500

@admin_bp.route('/cleanup-orphaned', methods=['POST'])
@token_required
@admin_required
def cleanup_orphaned():
    """
    Force cleanup of orphaned reserved tickets.
    
    Returns:
        tuple: (response_json, status_code)
    """
    try:
        logger.info("Starting manual cleanup of orphaned tickets")
        
        cleanup_results = ReservationService.cleanup_orphaned_tickets()
        
        return jsonify({
            'message': 'Orphaned tickets cleanup completed successfully',
            'tickets_cleaned': cleanup_results
        }), 200
        
    except Exception as e:
        logger.error(f"Manual cleanup failed: {str(e)}")
        return jsonify({'error': 'Cleanup failed'}), 500