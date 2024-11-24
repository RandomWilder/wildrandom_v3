from flask import Blueprint, request, jsonify, current_app
from src.shared.auth import token_required
from marshmallow import ValidationError
from src.raffle_service.services import (
    RaffleService,
    TicketService,
    DrawService
)
from src.raffle_service.models import RaffleStatus, RaffleState, Raffle 
import logging

logger = logging.getLogger(__name__)

public_bp = Blueprint('public', __name__, url_prefix='/api/raffles')

@public_bp.route('/<int:raffle_id>', methods=['GET'])
def get_raffle(raffle_id):
    """Get raffle details"""
    try:
        logger.debug(f"Fetching raffle {raffle_id}")
        
        # Get raffle with explicit error handling
        raffle = Raffle.query.get(raffle_id)
        if not raffle:
            logger.error(f"Raffle {raffle_id} not found")
            return jsonify({'error': 'Raffle not found'}), 404

        # Log current state
        logger.debug(f"Found raffle - Status: {raffle.status}, State: {raffle.state}")
        
        # Check visibility
        if not raffle.is_visible:
            logger.error(f"Raffle {raffle_id} exists but is not visible")
            return jsonify({'error': 'Raffle not found'}), 404

        # Return raffle data
        raffle_data = raffle.to_dict()
        logger.debug(f"Returning raffle data: {raffle_data}")
        return jsonify(raffle_data), 200

    except Exception as e:
        logger.error(f"Error fetching raffle: {str(e)}", exc_info=True)
        return jsonify({'error': str(e)}), 500

@public_bp.route('/', methods=['GET'])
def list_raffles():
    """List visible raffles"""
    try:
        raffles = Raffle.query.filter(
            Raffle.status == 'active'
        ).order_by(Raffle.start_time.desc()).all()

        return jsonify({
            'raffles': [raffle.to_dict() for raffle in raffles]
        }), 200

    except Exception as e:
        logger.error(f"Error listing raffles: {str(e)}", exc_info=True)
        return jsonify({'error': str(e)}), 500

@public_bp.route('/<int:raffle_id>/tickets', methods=['GET'])
@token_required
def get_my_tickets(raffle_id):
    """Get user's tickets for a specific raffle"""
    try:
        tickets, error = TicketService.get_user_tickets(
            user_id=request.current_user.id,
            raffle_id=raffle_id
        )
        if error:
            return jsonify({'error': error}), 400

        return jsonify([t.to_dict() for t in tickets]), 200

    except Exception as e:
        logger.error(f"Error getting user tickets: {str(e)}", exc_info=True)
        return jsonify({'error': 'Internal server error'}), 500

@public_bp.route('/<int:raffle_id>/tickets/reveal', methods=['POST'])
@token_required
def reveal_tickets(raffle_id):
    """Reveal user's tickets"""
    try:
        data = request.get_json()
        ticket_ids = data.get('ticket_ids', [])
        
        if not ticket_ids:
            return jsonify({'error': 'No tickets specified for reveal'}), 400

        revealed_tickets, error = TicketService.reveal_tickets(
            user_id=request.current_user.id,
            ticket_ids=ticket_ids
        )
        
        if error:
            return jsonify({'error': error}), 400

        return jsonify([t.to_dict() for t in revealed_tickets]), 200

    except Exception as e:
        logger.error(f"Error revealing tickets: {str(e)}", exc_info=True)
        return jsonify({'error': 'Internal server error'}), 500

@public_bp.route('/my-tickets', methods=['GET'])
@token_required
def get_all_my_tickets():
    """Get user's tickets across all raffles"""
    try:
        tickets, error = TicketService.get_user_tickets(
            user_id=request.current_user.id
        )
        if error:
            return jsonify({'error': error}), 400

        # Group tickets by raffle
        grouped_tickets = {}
        for ticket in tickets:
            if ticket.raffle_id not in grouped_tickets:
                grouped_tickets[ticket.raffle_id] = {
                    'raffle': ticket.raffle.to_dict(),
                    'tickets': []
                }
            grouped_tickets[ticket.raffle_id]['tickets'].append(ticket.to_dict())

        return jsonify(grouped_tickets), 200

    except Exception as e:
        logger.error(f"Error getting user tickets: {str(e)}", exc_info=True)
        return jsonify({'error': 'Internal server error'}), 500

@public_bp.route('/<int:raffle_id>/winners', methods=['GET'])
def get_raffle_winners(raffle_id):
    """Get raffle winners"""
    try:
        raffle, error = RaffleService.get_raffle(raffle_id)
        if error:
            return jsonify({'error': error}), 404

        if raffle.state != RaffleState.ENDED.value:
            return jsonify({'error': 'Winners not yet available'}), 400

        winners, error = DrawService.get_raffle_winners(raffle_id)
        if error:
            return jsonify({'error': error}), 400

        return jsonify(winners), 200

    except Exception as e:
        logger.error(f"Error getting winners: {str(e)}", exc_info=True)
        return jsonify({'error': 'Internal server error'}), 500

@public_bp.route('/my-wins', methods=['GET'])
@token_required
def get_my_wins():
    """Get user's winning tickets"""
    try:
        wins, error = DrawService.get_user_wins(request.current_user.id)
        if error:
            return jsonify({'error': error}), 400

        return jsonify(wins), 200

    except Exception as e:
        logger.error(f"Error getting user wins: {str(e)}", exc_info=True)
        return jsonify({'error': 'Internal server error'}), 500

@public_bp.route('/<int:raffle_id>/stats', methods=['GET'])
def get_public_stats(raffle_id):
    """Get public raffle statistics"""
    try:
        raffle, error = RaffleService.get_raffle(raffle_id)
        if error:
            return jsonify({'error': error}), 404

        if not raffle.is_visible():
            return jsonify({'error': 'Raffle not found'}), 404

        stats, error = TicketService.get_raffle_statistics(raffle_id)
        if error:
            return jsonify({'error': error}), 400

        # Filter sensitive information for public view
        public_stats = {
            'total_tickets': stats['total_tickets'],
            'available_tickets': stats['available_tickets'],
            'participants': stats['unique_participants'],
            'revealed_tickets': stats['revealed_tickets']
        }

        return jsonify(public_stats), 200

    except Exception as e:
        logger.error(f"Error getting public stats: {str(e)}", exc_info=True)
        return jsonify({'error': 'Internal server error'}), 500
    
@public_bp.route('/test', methods=['GET'])
def test_public_route():
    """Test route to verify public endpoint accessibility"""
    return jsonify({"message": "Public routes accessible"}), 200