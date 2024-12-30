# src/user_service/services/admin_auth_service.py

from typing import Optional, Tuple, Dict
from datetime import datetime, timezone, timedelta
from sqlalchemy import func, case, distinct, text, and_
from src.shared import db
from src.user_service.models.user import User
from src.user_service.models.user_activity import UserActivity
from src.raffle_service.models import Ticket, RaffleDraw, Raffle
from src.payment_service.services import PaymentService
from flask import Request
from src.shared.auth import create_token
import logging

logger = logging.getLogger(__name__)

def calculate_session_metrics(activities) -> Dict:
    """Calculate user session metrics based on activity logs"""
    SESSION_TIMEOUT = 30 * 60  # 30 minutes in seconds
    sessions = []
    current_session = []
    
    sorted_activities = sorted(activities, key=lambda x: x.created_at)
    
    for i, activity in enumerate(sorted_activities):
        if not current_session:
            current_session = [activity]
        else:
            time_diff = (activity.created_at - current_session[-1].created_at).total_seconds()
            if time_diff > SESSION_TIMEOUT:
                sessions.append(current_session)
                current_session = [activity]
            else:
                current_session.append(activity)
                
    if current_session:
        sessions.append(current_session)
    
    total_duration = sum(
        (session[-1].created_at - session[0].created_at).total_seconds()
        for session in sessions if len(session) > 1
    )
    
    return {
        'total_sessions': len(sessions),
        'avg_session_length': round(total_duration / len(sessions) / 60 if sessions else 0, 2),  # in minutes
        'total_duration': round(total_duration / 3600, 2)  # in hours
    }

class AdminAuthService:
    @staticmethod
    def authenticate_admin(username: str, password: str, request: Request) -> Tuple[Optional[Dict], Optional[str]]:
        """Authenticate an admin user"""
        try:
            user = User.query.filter_by(username=username).first()
            
            if not user:
                return None, "Invalid admin credentials"

            if not user.check_password(password):
                return None, "Invalid admin credentials"

            if not user.is_admin:
                return None, "Unauthorized: Admin access required"

            if not user.is_active:
                return None, "Account is deactivated"

            # Create token with admin flag
            token_data = {
                'user_id': user.id,
                'is_admin': True
            }
            token = create_token(user.id, additional_data=token_data)

            # Log admin login activity
            activity = UserActivity(
                user_id=user.id,
                activity_type='admin_login',
                ip_address=request.remote_addr,
                user_agent=request.user_agent.string,
                status='success'
            )
            
            # Update last login
            user.last_login = datetime.now(timezone.utc)
            
            db.session.add(activity)
            db.session.commit()

            return {
                'user': user.to_dict(),
                'token': token
            }, None

        except Exception as e:
            db.session.rollback()
            return None, str(e)
        
    @staticmethod
    def get_enhanced_user_details(user_id: int) -> Tuple[Optional[Dict], Optional[str]]:
        """Get comprehensive user details including gaming metrics"""
        try:
            user = User.query.get(user_id)
            if not user:
                return None, "User not found"

            # Get payment balance
            balance, _ = PaymentService.get_or_create_balance(user.id)

            # Base metrics calculation
            ticket_stats = db.session.query(
                func.count(Ticket.id).label('total_tickets'),
                func.count(case((Ticket.is_revealed == True, 1))).label('revealed_tickets'),
                func.count(distinct(Ticket.raffle_id)).label('total_raffles')
            ).filter(
                Ticket.user_id == user_id
            ).first()

            # Win count calculation
            win_count = db.session.query(
                func.count(RaffleDraw.id)
            ).join(
                Ticket, Ticket.ticket_id == RaffleDraw.ticket_id
            ).filter(
                Ticket.user_id == user_id,
                RaffleDraw.result == 'winner'
            ).scalar() or 0

            # Recent activities retrieval
            recent_activities = [{
                'type': activity.activity_type,
                'status': activity.status,
                'timestamp': activity.created_at.isoformat()
            } for activity in user.activities.order_by(
                UserActivity.created_at.desc()
            ).limit(5)]

            # Construct enhanced response
            response_data = {
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'first_name': user.first_name,
                'last_name': user.last_name,
                'phone_number': user.phone_number,
                'auth_provider': user.auth_provider,
                'is_verified': user.is_verified,
                'is_active': user.is_active,
                'is_admin': user.is_admin,
                'created_at': user.created_at.isoformat(),
                'last_login': user.last_login.isoformat() if user.last_login else None,

                # Loyalty metrics
                'loyalty_level': user.loyalty.current_level if user.loyalty else 'NEWBIE',
                'loyalty_badges': [badge['type'] for badge in user.loyalty.badges] if user.loyalty and user.loyalty.badges else [],
                'loyalty_total_entries': user.loyalty.total_entries if user.loyalty else 0,
                'loyalty_total_spend': float(user.loyalty.total_spend) if user.loyalty else 0.0,
                'loyalty_streak_days': user.loyalty.streak_days if user.loyalty else 0,
                'loyalty_last_activity': user.loyalty.last_activity.isoformat() if user.loyalty and user.loyalty.last_activity else None,
                'loyalty_level_updated_at': user.loyalty.level_updated_at.isoformat() if user.loyalty and user.loyalty.level_updated_at else None,

                # Gaming metrics
                'gaming_metrics': {
                    'total_tickets': ticket_stats.total_tickets or 0,
                    'revealed_tickets': ticket_stats.revealed_tickets or 0,
                    'total_raffles': ticket_stats.total_raffles or 0,
                    'total_wins': win_count
                },

                # Balance info
                'balance_available': float(balance.available_amount) if balance else 0.0,
                'balance_last_updated': balance.last_updated.isoformat() if balance and balance.last_updated else None,

                # Activity tracking
                'recent_activities': recent_activities,
                'status_changes': [],
                'verification_status': 'verified' if user.is_verified else 'pending'
            }

            return response_data, None

        except Exception as e:
            logger.error(f"Error constructing enhanced user details: {str(e)}", exc_info=True)
            return None, str(e)

            # Construct response structure with properly joined metrics
            response_data = {
                # Base user info - Proven working
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'first_name': user.first_name,
                'last_name': user.last_name,
                'phone_number': user.phone_number,
                'auth_provider': user.auth_provider,
                'is_verified': user.is_verified,
                'is_active': user.is_active,
                'is_admin': user.is_admin,
                'created_at': user.created_at.isoformat(),
                'last_login': user.last_login.isoformat() if user.last_login else None,

                # Loyalty system data - Proven working
                'loyalty_level': user.loyalty.current_level if user.loyalty else 'NEWBIE',
                'loyalty_badges': [badge['type'] for badge in user.loyalty.badges] if user.loyalty and user.loyalty.badges else [],
                'loyalty_total_entries': user.loyalty.total_entries if user.loyalty else 0,
                'loyalty_total_spend': float(user.loyalty.total_spend) if user.loyalty else 0.0,
                'loyalty_streak_days': user.loyalty.streak_days if user.loyalty else 0,
                'loyalty_last_activity': user.loyalty.last_activity.isoformat() if user.loyalty and user.loyalty.last_activity else None,
                'loyalty_level_updated_at': user.loyalty.level_updated_at.isoformat() if user.loyalty and user.loyalty.level_updated_at else None,

                # Balance data - Proven working
                'balance_available': float(balance.available_amount) if balance else 0.0,
                'balance_last_updated': balance.last_updated.isoformat() if balance and balance.last_updated else None,

                # Activity tracking - Proven working
                'recent_activities': recent_activities,
                'status_changes': [],
                'verification_status': 'verified' if user.is_verified else 'pending',

                # New Gaming Metrics - Simple, reliable queries
                'gaming_metrics': {
                    'total_tickets': db.session.query(func.count(Ticket.id))
                        .filter(Ticket.user_id == user_id)
                        .scalar() or 0,
                    'revealed_tickets': db.session.query(func.count(Ticket.id))
                        .filter(
                            Ticket.user_id == user_id,
                            Ticket.is_revealed == True
                        ).scalar() or 0,
                    'total_wins': db.session.query(func.count(RaffleDraw.id))
                        .join(Ticket, and_(
                            Ticket.ticket_id == RaffleDraw.ticket_id,
                            Ticket.user_id == user_id,
                            RaffleDraw.result == 'winner'
                        ))
                        .scalar() or 0
                }
            }

            return response_data, None

        except Exception as e:
            logger.error(f"Error constructing enhanced user details: {str(e)}", exc_info=True)
            return None, str(e)