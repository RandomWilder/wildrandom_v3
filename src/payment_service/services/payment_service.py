# src/payment_service/services/payment_service.py

from datetime import datetime, timezone
from decimal import Decimal
from typing import List, Optional, Tuple, Dict
from sqlalchemy.exc import SQLAlchemyError
from src.shared import db
from src.payment_service.models import Transaction, TransactionType, TransactionStatus
from src.payment_service.services.balance_service import BalanceService
from src.raffle_service.services import TicketService
from .base_service import BasePaymentService
import logging

logger = logging.getLogger(__name__)

class PaymentService(BasePaymentService):
    @classmethod
    @BasePaymentService.handle_transaction
    def process_ticket_purchase(
        cls,
        user_id: int,
        raffle_id: int,
        ticket_ids: List[str],
        total_amount: Decimal
    ) -> Tuple[Optional[Transaction], Optional[str]]:
        """Process ticket purchase transaction"""
        try:
            # 1. Validate balance
            balance, error = BalanceService.get_user_balance(user_id)
            if error:
                return None, error

            if not balance.can_debit(total_amount):
                return None, "Insufficient balance"

            # 2. Create pending transaction
            transaction = Transaction(
                user_id=user_id,
                type=TransactionType.DEBIT.value,
                amount=total_amount,
                reference_type='ticket_purchase',
                reference_id=f"raffle_{raffle_id}",
                metadata={'ticket_ids': ticket_ids}
            )
            db.session.add(transaction)
            db.session.flush()

            # 3. Reserve tickets
            tickets, error = TicketService.reserve_tickets(
                raffle_id=raffle_id,
                user_id=user_id,
                ticket_ids=ticket_ids
            )
            if error:
                transaction.fail(error)
                return None, error

            # 4. Process payment
            balance.debit(total_amount)
            
            # 5. Complete transaction
            transaction.complete(balance.available_amount)
            
            # 6. Finalize ticket purchase
            purchase_result, error = TicketService.purchase_tickets(
                user_id=user_id,
                ticket_ids=ticket_ids,
                transaction_id=transaction.id
            )
            
            if error:
                # Rollback everything
                balance.credit(total_amount)
                transaction.rollback(error)
                return None, error

            return transaction, None

        except Exception as e:
            logger.error(f"Error processing ticket purchase: {str(e)}")
            return None, str(e)

    @classmethod
    @BasePaymentService.handle_transaction
    def process_prize_claim(
        cls,
        user_id: int,
        prize_instance_id: str,
        credit_amount: Decimal
    ) -> Tuple[Optional[Transaction], Optional[str]]:
        """Process prize claim credit transaction"""
        try:
            # Create and process credit transaction
            transaction = Transaction(
                user_id=user_id,
                type=TransactionType.CREDIT.value,
                amount=credit_amount,
                reference_type='prize_claim',
                reference_id=prize_instance_id
            )
            db.session.add(transaction)
            db.session.flush()

            # Update balance
            balance, error = BalanceService.get_user_balance(user_id)
            if error:
                transaction.fail(error)
                return None, error

            balance.credit(credit_amount)
            transaction.complete(balance.available_amount)

            return transaction, None

        except Exception as e:
            logger.error(f"Error processing prize claim: {str(e)}")
            return None, str(e)