from flask import Blueprint, request, jsonify
from src.shared.auth import token_required, admin_required
from src.payment_service.services import PaymentService
from decimal import Decimal
import logging

logger = logging.getLogger(__name__)

admin_bp = Blueprint('admin_payments', __name__, url_prefix='/api/admin/payments')

@admin_bp.route('/transactions', methods=['GET'])
@token_required
@admin_required
def list_transactions():
    """List all transactions (admin only)"""
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        user_id = request.args.get('user_id', type=int)
        status = request.args.get('status')
        ref_type = request.args.get('reference_type')
        
        transactions, total = PaymentService.get_transactions(
            page=page,
            per_page=per_page,
            user_id=user_id,
            status=status,
            reference_type=ref_type
        )
        
        return jsonify({
            'transactions': [t.to_dict() for t in transactions],
            'total': total,
            'page': page,
            'per_page': per_page
        }), 200
        
    except Exception as e:
        logger.error(f"Error listing transactions: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500

@admin_bp.route('/adjust-balance', methods=['POST'])
@token_required
@admin_required
def adjust_balance():
    """Adjust user balance (admin only)"""
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No data provided'}), 400

        required_fields = ['user_id', 'amount', 'is_credit', 'reason']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'Missing required field: {field}'}), 400

        transaction, error = PaymentService.admin_adjust_balance(
            user_id=data['user_id'],
            amount=Decimal(str(data['amount'])),
            is_credit=data['is_credit'],
            reason=data['reason'],
            admin_id=request.current_user.id
        )

        if error:
            return jsonify({'error': error}), 400

        return jsonify({
            'transaction': transaction.to_dict(),
            'message': 'Balance adjusted successfully'
        }), 200

    except ValueError as e:
        return jsonify({'error': str(e)}), 400
    except Exception as e:
        logger.error(f"Error adjusting balance: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500

@admin_bp.route('/process-refund', methods=['POST'])
@token_required
@admin_required
def process_refund():
    """Process refund for a transaction"""
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No data provided'}), 400

        required_fields = ['transaction_id', 'reason']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'Missing required field: {field}'}), 400

        refund_transaction, error = PaymentService.process_refund(
            transaction_id=data['transaction_id'],
            reason=data['reason'],
            admin_id=request.current_user.id
        )

        if error:
            return jsonify({'error': error}), 400

        return jsonify({
            'transaction': refund_transaction.to_dict(),
            'message': 'Refund processed successfully'
        }), 200

    except Exception as e:
        logger.error(f"Error processing refund: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500