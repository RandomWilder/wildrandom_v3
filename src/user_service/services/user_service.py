from typing import Optional, Tuple, List, Dict
from datetime import datetime, timezone, timedelta
from sqlalchemy.exc import SQLAlchemyError, IntegrityError
from sqlalchemy import func, desc, or_
from src.shared import db
from src.user_service.models import User, UserStatusChange
from src.user_service.services.activity_service import ActivityService
from src.payment_service.services import PaymentService
from src.user_service.models import (
    User, 
    UserLoyalty,
    UserActivity, 
    UserStatusChange, 
    CreditTransaction, 
    PasswordReset,
    LoyaltyHistory
)
import logging

logger = logging.getLogger(__name__)

class UserService:
    @staticmethod
    def create_user(data: Dict) -> Tuple[Optional[User], Optional[str]]:
        """Create a new user with validation"""
        try:
            logger.debug("Creating new user with data:")
            logger.debug(f"Username: {data.get('username')}")
            logger.debug(f"Email: {data.get('email')}")
            logger.debug(f"Has password: {bool(data.get('password'))}")
            logger.debug(f"Has phone: {bool(data.get('phone_number'))}")

            # Check for existing username, email, or phone
            existing_checks = [
                ('username', data.get('username')),
                ('email', data.get('email')),
                ('phone_number', data.get('phone_number'))
            ]

            for field, value in existing_checks:
                if value:
                    existing = User.query.filter(getattr(User, field) == value).first()
                    if existing:
                        return None, f"{field.replace('_', ' ').title()} is already in use"

            # Create user instance
            user = User(
                username=data['username'],
                email=data['email'],
                first_name=data.get('first_name'),
                last_name=data.get('last_name'),
                phone_number=data.get('phone_number'),
                auth_provider='local'
            )
            
            # Set password with extended logging
            logger.debug(f"Setting password for new user {user.username}")
            password = data.get('password')
            logger.debug(f"Password present: {bool(password)}")
            
            if not user.set_password(password):
                logger.error("Failed to set password")
                return None, "Failed to set password"
                
            logger.debug(f"Password hash after setting: {bool(user.password_hash)}")
            if user.password_hash:
                logger.debug(f"Hash starts with: {user.password_hash[:20]}...")

            db.session.add(user)
            
            # Verify password hash before commit
            logger.debug("Verifying password hash before commit")
            if not user.password_hash:
                logger.error("No password hash found before commit")
                db.session.rollback()
                return None, "Password hash verification failed"
                
            # Test password verification before commit
            logger.debug("Testing password verification before commit")
            if not user.check_password(password):
                logger.error("Password verification failed before commit")
                db.session.rollback()
                return None, "Password verification failed"

            try:
                # Commit with final verification
                db.session.commit()
                
                # Verify after commit
                db.session.refresh(user)
                logger.debug("Final user state after commit:")
                logger.debug(f"ID: {user.id}")
                logger.debug(f"Has password hash: {bool(user.password_hash)}")
                
                return user, None
                
            except IntegrityError as e:
                db.session.rollback()
                logger.error(f"Integrity error during user creation: {str(e)}")
                return None, "User creation failed due to data conflict"
            
        except SQLAlchemyError as e:
            db.session.rollback()
            logger.error(f"Database error in create_user: {str(e)}")
            return None, str(e)

    @staticmethod
    def get_user(user_id: int) -> Tuple[Optional[User], Optional[str]]:
        """Get user by ID"""
        try:
            user = User.query.get(user_id)
            if not user:
                return None, "User not found"
            return user, None
            
        except SQLAlchemyError as e:
            logger.error(f"Database error in get_user: {str(e)}")
            return None, str(e)

    @staticmethod
    def get_user_by_email(email: str) -> Tuple[Optional[User], Optional[str]]:
        """Get user by email"""
        try:
            user = User.query.filter_by(email=email).first()
            if not user:
                return None, "User not found"
            return user, None
            
        except SQLAlchemyError as e:
            logger.error(f"Database error in get_user_by_email: {str(e)}")
            return None, str(e)

    @staticmethod
    def update_user(user_id: int, data: Dict) -> Tuple[Optional[User], Optional[str]]:
        """Update user details"""
        try:
            user = User.query.get(user_id)
            if not user:
                return None, "User not found"

            # Validate email uniqueness if changing
            if 'email' in data and data['email'] != user.email:
                existing = User.query.filter_by(email=data['email']).first()
                if existing:
                    return None, "Email already in use"

            # Update allowed fields
            for field in ['email', 'first_name', 'last_name']:
                if field in data:
                    setattr(user, field, data[field])

            # Log activity
            ActivityService.log_activity(
                user_id=user.id,
                activity_type='profile_update',
                request=None,
                status='success',
                details={'updated_fields': list(data.keys())}
            )
            
            db.session.commit()
            return user, None
            
        except SQLAlchemyError as e:
            db.session.rollback()
            logger.error(f"Database error in update_user: {str(e)}")
            return None, str(e)

    @staticmethod
    def update_user_status(
        user_id: int,
        is_active: bool,
        reason: str,
        admin_id: int
    ) -> Tuple[Optional[User], Optional[str]]:
        """Update user active status"""
        try:
            user = User.query.get(user_id)
            if not user:
                return None, "User not found"

            if user.is_admin and not is_active:
                return None, "Cannot deactivate admin users"

            # Create status change record
            status_change = UserStatusChange(
                user_id=user_id,
                changed_by_id=admin_id,
                previous_status=user.is_active,
                new_status=is_active,
                reason=reason
            )

            user.is_active = is_active
            db.session.add(status_change)
            
            # Log activity
            ActivityService.log_activity(
                user_id=user.id,
                activity_type='status_change',
                request=None,
                status='success',
                details={
                    'new_status': is_active,
                    'reason': reason,
                    'changed_by': admin_id
                }
            )
            
            db.session.commit()
            return user, None
            
        except SQLAlchemyError as e:
            db.session.rollback()
            logger.error(f"Database error in update_user_status: {str(e)}")
            return None, str(e)

    @staticmethod
    def delete_user(user_id: int) -> Tuple[bool, Optional[str]]:
        """Soft delete user"""
        try:
            user = User.query.get(user_id)
            if not user:
                return False, "User not found"

            if user.is_admin:
                return False, "Cannot delete admin users"

            user.is_active = False
            
            # Log activity
            ActivityService.log_activity(
                user_id=user.id,
                activity_type='account_deletion',
                request=None,
                status='success'
            )
            
            db.session.commit()
            return True, None
            
        except SQLAlchemyError as e:
            db.session.rollback()
            logger.error(f"Database error in delete_user: {str(e)}")
            return False, str(e)

    @staticmethod
    def search_users(
        query: str,
        page: int = 1,
        per_page: int = 20
    ) -> Tuple[Optional[List[User]], int, Optional[str]]:
        """Search users with pagination"""
        try:
            search = f"%{query}%"
            user_query = User.query.filter(
                or_(
                    User.username.ilike(search),
                    User.email.ilike(search),
                    User.first_name.ilike(search),
                    User.last_name.ilike(search)
                )
            )
            
            total = user_query.count()
            users = user_query.offset((page - 1) * per_page).limit(per_page).all()
            
            return users, total, None
            
        except SQLAlchemyError as e:
            logger.error(f"Database error in search_users: {str(e)}")
            return None, 0, str(e)
        
    @staticmethod
    def get_admin_user_details(user_id: int) -> Tuple[Optional[Dict], Optional[str]]:
        """Get comprehensive user details for admin view"""
        try:
            # Base user query with necessary joins
            user = db.session.query(User)\
                .outerjoin(User.loyalty)\
                .filter(User.id == user_id)\
                .first()

            if not user:
                return None, "User not found"

            # Get user base data including balance
            user_dict = user.to_dict()
            
            # Get loyalty data safely
            loyalty = user.loyalty

            # Get recent activities (last 5)
            recent_activities = UserActivity.query\
                .filter_by(user_id=user_id)\
                .order_by(UserActivity.created_at.desc())\
                .limit(5)\
                .all()

            # Build response dictionary
            response_data = {
                # Core User Data
                "id": user_dict["id"],
                "username": user_dict["username"],
                "email": user_dict["email"],
                "first_name": user_dict.get("first_name"),
                "last_name": user_dict.get("last_name"),
                "phone_number": user_dict.get("phone_number"),
                "auth_provider": user_dict["auth_provider"],
                "is_verified": user_dict["is_verified"],
                "is_active": user_dict["is_active"],
                "is_admin": user_dict["is_admin"],
                "created_at": user_dict["created_at"],  # Already string from to_dict()
                "last_login": user_dict.get("last_login"),  # Already string from to_dict()
                "verification_status": "verified" if user_dict["is_verified"] else "pending",

                # Balance Data from user_dict
                "balance_available": user_dict["balance"]["available"],
                "balance_last_updated": user_dict["balance"]["last_updated"],  # Already string

                # Loyalty Data
                "loyalty_level": loyalty.current_level if loyalty else "NEWBIE",
                "loyalty_badges": loyalty.badges if loyalty else [],
                "loyalty_total_entries": loyalty.total_entries if loyalty else 0,
                "loyalty_total_spend": loyalty.total_spend if loyalty else 0.0,
                "loyalty_streak_days": loyalty.streak_days if loyalty else 0,
                "loyalty_last_activity": loyalty.last_activity.isoformat() if loyalty and loyalty.last_activity else None,
                "loyalty_level_updated_at": loyalty.level_updated_at.isoformat() if loyalty and loyalty.level_updated_at else None,

                # Activity Data
                "recent_activities": [{
                    "timestamp": activity.created_at.isoformat(),
                    "type": activity.activity_type,
                    "status": activity.status
                } for activity in (recent_activities or [])],
                
                # Empty status changes for now
                "status_changes": []
            }

            return response_data, None

        except Exception as e:
            logger.error(f"Error retrieving admin user details: {str(e)}", exc_info=True)
            return None, str(e)