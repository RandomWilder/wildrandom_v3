from flask import Blueprint, request, jsonify
from src.shared.auth import token_required
from src.payment_service.services import PaymentService
from src.payment_service.schemas import BalanceResponseSchema
from marshmallow import ValidationError
import logging
from src.payment_service.models import Transaction

logger = logging.getLogger(__name__)

public_bp = Blueprint('payments', __name__, url_prefix='/api/payments')

@public_bp.route('/balance', methods=['GET'])
@token_required
def get_balance():
    """Get user's balance"""
    try:
        balance, error = PaymentService.get_or_create_balance(request.current_user.id)
        if error:
            return jsonify({'error': error}), 400
            
        return jsonify(balance.to_dict()), 200
    except Exception as e:
        logger.error(f"Error getting balance: {str(e)}", exc_info=True)
        return jsonify({'error': 'Internal server error'}), 500

@public_bp.route('/purchase', methods=['POST'])
@token_required
def purchase_tickets():
    """Purchase tickets with site credits"""
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No data provided'}), 400

        # Validate required fields
        if 'reservation_id' not in data:
            return jsonify({'error': 'Reservation ID required'}), 400

        transaction, error = PaymentService.process_reservation(
            user_id=request.current_user.id,
            reservation_id=data['reservation_id']
        )

        if error:
            return jsonify({'error': error}), 400

        response_data = {
            'transaction': transaction.to_dict(),
            'message': 'Purchase successful',
            'tickets': transaction.meta_data.get('ticket_ids', []),
            'total_amount': float(transaction.amount),
            'new_balance': float(transaction.balance_after) if transaction.balance_after else None
        }

        return jsonify(response_data), 200

    except Exception as e:
        logger.error(f"Error processing purchase: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500

@public_bp.route('/transactions', methods=['GET'])
@token_required
def get_transactions():
    """Get user's transaction history"""
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        
        # Add error logging
        logger.debug(f"Getting transactions for user {request.current_user.id}")
        
        transactions = Transaction.query.filter_by(
            user_id=request.current_user.id
        ).order_by(
            Transaction.created_at.desc()
        ).paginate(
            page=page, 
            per_page=per_page,
            error_out=False
        )
        
        return jsonify({
            'transactions': [t.to_dict() for t in transactions.items],
            'total': transactions.total,
            'page': page,
            'per_page': per_page,
            'pages': transactions.pages
        }), 200
        
    except Exception as e:
        logger.error(f"Error getting transactions: {str(e)}", exc_info=True)
        return jsonify({'error': 'Internal server error'}), 500