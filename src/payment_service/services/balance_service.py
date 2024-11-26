# src/payment_service/services/balance_service.py

from typing import Optional, Tuple
from decimal import Decimal
from sqlalchemy.exc import SQLAlchemyError
from src.shared import db
from src.payment_service.models import Balance
from .base_service import BasePaymentService
import logging

logger = logging.getLogger(__name__)

class BalanceService(BasePaymentService):
    @classmethod
    @BasePaymentService.validate_user_access
    def get_user_balance(cls, user_id: int) -> Tuple[Optional[Balance], Optional[str]]:
        """Get or create user balance"""
        try:
            balance = Balance.query.get(user_id)
            if not balance:
                balance = Balance(user_id=user_id)
                db.session.add(balance)
                db.session.flush()
            return balance, None
        except SQLAlchemyError as e:
            return None, str(e)

    @classmethod
    @BasePaymentService.handle_transaction
    def update_balance(
        cls,
        user_id: int,
        amount: Decimal,
        is_credit: bool,
        reason: str
    ) -> Tuple[Optional[Balance], Optional[str]]:
        """Update user balance"""
        try:
            balance, error = cls.get_user_balance(user_id)
            if error:
                return None, error

            if is_credit:
                balance.credit(amount)
            else:
                if not balance.can_debit(amount):
                    return None, "Insufficient balance"
                balance.debit(amount)

            return balance, None
        except Exception as e:
            return None, str(e)