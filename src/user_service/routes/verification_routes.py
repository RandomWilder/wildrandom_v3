# src/user_service/routes/verification_routes.py

from flask import Blueprint, request, jsonify
from src.shared.auth import token_required
from src.user_service.services.email_service import EmailService
from src.user_service.models import User
from src.shared import db
from datetime import datetime, timezone
import logging

logger = logging.getLogger(__name__)

verification_bp = Blueprint('verification', __name__, url_prefix='/api/users/verify')

@verification_bp.route('/request', methods=['POST'])
@token_required
def request_verification():
    """Request a new verification email"""
    try:
        user = request.current_user
        
        if user.is_verified:
            return jsonify({
                'message': 'Email already verified',
                'email': user.email
            }), 200
        
        # Generate and save verification token
        token, expiry = user.set_verification_token()
        
        # Send verification email
        EmailService.send_verification_email(
            user_id=user.id,
            email=user.email,
            token=token
        )
        
        db.session.commit()
        
        return jsonify({
            'message': 'Verification email sent',
            'email': user.email,
            'expires_at': expiry.isoformat()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        logger.error(f"Error requesting verification: {str(e)}")
        return jsonify({'error': 'Failed to send verification email'}), 500

@verification_bp.route('/confirm/<token>', methods=['GET'])
def confirm_email(token):
    """Confirm email with verification token"""
    try:
        user = User.query.filter_by(verification_token=token).first()
        
        if not user:
            return jsonify({'error': 'Invalid verification token'}), 400
            
        if user.is_verified:
            return jsonify({
                'message': 'Email already verified',
                'email': user.email
            }), 200
            
        # Ensure we're comparing timezone-aware datetimes
        current_time = datetime.now(timezone.utc)
        expiry_time = user.verification_token_expires.replace(tzinfo=timezone.utc) if user.verification_token_expires else None
            
        if not expiry_time or current_time > expiry_time:
            return jsonify({'error': 'Verification token has expired'}), 400
        
        # Mark as verified and clear token
        user.is_verified = True
        user.clear_verification_token()
        
        db.session.commit()
        
        return jsonify({
            'message': 'Email verified successfully',
            'email': user.email
        }), 200
        
    except Exception as e:
        db.session.rollback()
        logger.error(f"Error confirming email: {str(e)}", exc_info=True)
        return jsonify({'error': 'Failed to verify email'}), 500

@verification_bp.route('/status', methods=['GET'])
@token_required
def verification_status():
    """Get current verification status"""
    try:
        user = request.current_user
        
        return jsonify({
            'is_verified': user.is_verified,
            'email': user.email,
            'verification_pending': bool(user.verification_token),
            'expires_at': user.verification_token_expires.isoformat() if user.verification_token_expires else None
        }), 200
        
    except Exception as e:
        logger.error(f"Error checking verification status: {str(e)}")
        return jsonify({'error': 'Failed to get verification status'}), 500