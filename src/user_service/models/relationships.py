# src/user_service/models/relationships.py

from src.shared import db
from .user import User
from .user_status import UserStatusChange
from .credit_transaction import CreditTransaction
from .user_activity import UserActivity
from .password_reset import PasswordReset

# User relationships
User.status_changes = db.relationship('UserStatusChange',
    foreign_keys='UserStatusChange.user_id',
    backref=db.backref('user', lazy=True),
    lazy='dynamic'
)

User.status_changes_made = db.relationship('UserStatusChange',
    foreign_keys='UserStatusChange.changed_by_id',
    backref=db.backref('changed_by', lazy=True),
    lazy='dynamic'
)

User.credit_transactions = db.relationship('CreditTransaction',
    foreign_keys='CreditTransaction.user_id',
    backref=db.backref('user', lazy=True),
    lazy='dynamic'
)

User.credit_transactions_created = db.relationship('CreditTransaction',
    foreign_keys='CreditTransaction.created_by_id',
    backref=db.backref('created_by', lazy=True),
    lazy='dynamic'
)

User.activities = db.relationship('UserActivity',
    backref=db.backref('user', lazy=True),
    lazy='dynamic'
)

User.password_resets = db.relationship('PasswordReset',
    backref=db.backref('user', lazy=True),
    lazy='dynamic'
)

User.loyalty = db.relationship('UserLoyalty',
    backref=db.backref('user', lazy=True),
    uselist=False,  # One-to-one relationship
    lazy=True
)

User.loyalty_history = db.relationship('LoyaltyHistory',
    backref=db.backref('user', lazy=True),
    lazy='dynamic'
)