# src/payment_service/services/audit_service.py

from typing import Optional, Tuple, Dict
from sqlalchemy.exc import SQLAlchemyError
from src.shared import db
from src.payment_service.models import TransactionLog
from .base_service import BasePaymentService
import logging

logger = logging.getLogger(__name__)

class AuditService(BasePaymentService):
    @classmethod
    @BasePaymentService.handle_transaction
    def log_transaction_event(
        cls,
        transaction_id: int,
        action: str,
        status: str,
        detail: Dict = None
    ) -> Tuple[Optional[TransactionLog], Optional[str]]:
        """Log transaction event"""
        try:
            log = TransactionLog(
                transaction_id=transaction_id,
                action=action,
                status=status,
                detail=detail
            )
            db.session.add(log)
            db.session.flush()
            return log, None
        except SQLAlchemyError as e:
            return None, str(e)