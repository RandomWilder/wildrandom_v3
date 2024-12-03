from flask import Blueprint, request, jsonify, current_app
from src.shared.auth import token_required
from src.raffle_service.services.reservation_service import ReservationService, TicketReservation, ReservationStatus
from src.prize_center_service.services import InstanceService
from marshmallow import ValidationError
from src.raffle_service.services import (
    RaffleService,
    TicketService,
    DrawService
)
from src.raffle_service.models import RaffleStatus, RaffleState, Raffle, Ticket, TicketStatus
from src.shared.database import db
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

        # Force state update and commit
        previous_state = raffle.state
        raffle.update_state()
        if previous_state != raffle.state:
            logger.info(f"Raffle {raffle_id} state updated from {previous_state} to {raffle.state}")
            db.session.commit()

        # Log current state
        logger.debug(f"Found raffle - Status: {raffle.status}, State: {raffle.state}")
        
        # Check visibility
        if not raffle.is_visible():
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
    
@public_bp.route('/<int:raffle_id>/reserve', methods=['POST'])
@token_required
def reserve_tickets(raffle_id):
    """Reserve tickets for purchase"""
    try:
        data = request.get_json()
        quantity = data.get('quantity')
        
        if not quantity or not isinstance(quantity, int) or quantity < 1:
            return jsonify({'error': 'Valid quantity required'}), 400

        # Check user's current reservations
        current_reservations = TicketReservation.query.filter_by(
            user_id=request.current_user.id,
            raffle_id=raffle_id,
            status=ReservationStatus.PENDING
        ).count()

        if current_reservations > 0:
            return jsonify({'error': 'You have pending reservations'}), 400

        reservation, error = ReservationService.create_reservation(
            user_id=request.current_user.id,
            raffle_id=raffle_id,
            quantity=quantity
        )

        if error:
            return jsonify({'error': error}), 400

        return jsonify({
            'reservation': reservation.to_dict(),
            'next_step': {
                'action': 'purchase',
                'endpoint': '/api/payments/purchase',
                'method': 'POST',
                'payload': {
                    'reservation_id': reservation.id
                }
            }
        }), 200

    except Exception as e:
        logger.error(f"Error reserving tickets: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500

# Add reservation status endpoint
@public_bp.route('/reservations/<int:reservation_id>', methods=['GET'])
@token_required
def get_reservation_status(reservation_id):
    """Get reservation status"""
    try:
        reservation, error = ReservationService.get_reservation(
            reservation_id=reservation_id,
            user_id=request.current_user.id
        )

        if error:
            return jsonify({'error': error}), 400

        return jsonify(reservation.to_dict()), 200

    except Exception as e:
        logger.error(f"Error getting reservation: {str(e)}")
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
    
@public_bp.route('/<int:raffle_id>/tickets/<string:ticket_id>/discover', methods=['POST'])
@token_required
def discover_prize(raffle_id: int, ticket_id: str):
    """Discover prize for an instant win eligible ticket"""
    try:
        # 1. Verify ticket ownership and eligibility
        ticket = Ticket.query.filter_by(
            raffle_id=raffle_id,
            ticket_id=ticket_id,
            user_id=request.current_user.id,
            status=TicketStatus.REVEALED.value,
            instant_win_eligible=True
        ).first()

        if not ticket:
            return jsonify({
                'error': 'Invalid ticket or not eligible for prize discovery'
            }), 400

        # 2. Get raffle and prize pool
        raffle = Raffle.query.get(raffle_id)
        if not raffle:
            return jsonify({'error': 'Raffle not found'}), 404

        # 3. Attempt prize discovery
        instance, error = InstanceService.discover_instant_win(
            pool_id=raffle.prize_pool_id,
            ticket_id=ticket.ticket_id
        )

        if error:
            return jsonify({'error': error}), 400

        # 4. Format response
        if instance:
            return jsonify({
                'message': 'Prize discovered!',
                'prize': {
                    'instance_id': instance.instance_id,
                    'type': instance.instance_type,
                    'values': {
                        'retail': float(instance.retail_value),
                        'cash': float(instance.cash_value),
                        'credit': float(instance.credit_value)
                    }
                }
            }), 200
        else:
            return jsonify({
                'message': 'No prize won',
                'ticket_id': ticket_id
            }), 200

    except Exception as e:
        logger.error(f"Error discovering prize: {str(e)}", exc_info=True)
        return jsonify({'error': 'Internal server error'}), 500
    
@public_bp.route('/test', methods=['GET'])
def test_public_route():
    """Test route to verify public endpoint accessibility"""
    return jsonify({"message": "Public routes accessible"}), 200