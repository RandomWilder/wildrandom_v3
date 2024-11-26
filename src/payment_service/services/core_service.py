# src/payment_service/services/core_service.py

from datetime import datetime, timezone
from decimal import Decimal
from typing import List, Optional, Tuple, Dict
from sqlalchemy.exc import SQLAlchemyError
from src.shared import db
from src.raffle_service.models import (
    TicketReservation,
    ReservationStatus,
    Ticket,
    TicketStatus
)
from src.raffle_service.services import ReservationService
from src.payment_service.models import (
    Transaction, TransactionType, TransactionStatus,
    Balance, TransactionLog
)
from src.raffle_service.services import TicketService
from src.payment_service.models import ReferenceType
from src.user_service.models import CreditTransaction
from .base_service import BasePaymentService
import logging

logger = logging.getLogger(__name__)

class CorePaymentService(BasePaymentService):
    """Core service implementing all payment operations"""

    @classmethod
    def get_or_create_balance(cls, user_id: int) -> Tuple[Optional[Balance], Optional[str]]:
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
    def log_event(cls, transaction_id: int, action: str, status: str, detail: Dict = None) -> None:
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
        except SQLAlchemyError as e:
            logger.error(f"Failed to log event: {str(e)}")

    @classmethod
    @BasePaymentService.handle_transaction
    def process_ticket_purchase(
        cls,
        user_id: int,
        raffle_id: int,
        ticket_ids: List[str],
        total_amount: Decimal
    ) -> Tuple[Optional[Transaction], Optional[str]]:
        """Process ticket purchase as atomic transaction"""
        try:
            # 1. Get/Validate balance
            balance, error = cls.get_or_create_balance(user_id)
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
                cls.log_event(transaction.id, 'reserve_tickets', 'failed', {'error': error})
                return None, error

            # 4. Process payment
            try:
                balance.debit(total_amount)
                cls.log_event(transaction.id, 'process_payment', 'success')
            except ValueError as e:
                transaction.fail(str(e))
                cls.log_event(transaction.id, 'process_payment', 'failed', {'error': str(e)})
                return None, str(e)

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
                cls.log_event(transaction.id, 'finalize_purchase', 'failed', {'error': error})
                return None, error

            cls.log_event(transaction.id, 'purchase_complete', 'success')
            return transaction, None

        except Exception as e:
            logger.error(f"Error processing ticket purchase: {str(e)}")
            if 'transaction' in locals():
                cls.log_event(transaction.id, 'process_purchase', 'failed', {'error': str(e)})
            return None, str(e)

    @classmethod
    @BasePaymentService.handle_transaction
    def process_prize_claim(
        cls,
        user_id: int,
        prize_instance_id: str,
        credit_amount: Decimal
    ) -> Tuple[Optional[Transaction], Optional[str]]:
        """Process prize claim credit"""
        try:
            transaction = Transaction(
                user_id=user_id,
                type=TransactionType.CREDIT.value,
                amount=credit_amount,
                reference_type='prize_claim',
                reference_id=prize_instance_id
            )
            db.session.add(transaction)
            db.session.flush()

            balance, error = cls.get_or_create_balance(user_id)
            if error:
                transaction.fail(error)
                cls.log_event(transaction.id, 'get_balance', 'failed', {'error': error})
                return None, error

            try:
                balance.credit(credit_amount)
                transaction.complete(balance.available_amount)
                cls.log_event(transaction.id, 'process_claim', 'success')
                return transaction, None
            except Exception as e:
                transaction.fail(str(e))
                cls.log_event(transaction.id, 'process_claim', 'failed', {'error': str(e)})
                return None, str(e)

        except Exception as e:
            logger.error(f"Error processing prize claim: {str(e)}")
            if 'transaction' in locals():
                cls.log_event(transaction.id, 'process_claim', 'failed', {'error': str(e)})
            return None, str(e)
        
    @classmethod
    @BasePaymentService.handle_transaction
    def admin_adjust_balance(
        cls,
        user_id: int,
        amount: Decimal,
        is_credit: bool,
        reason: str,
        admin_id: int
    ) -> Tuple[Optional[Transaction], Optional[str]]:
        """Process admin balance adjustment"""
        try:
            # Get or create balance
            balance, error = cls.get_or_create_balance(user_id)
            if error:
                return None, error

            # Create transaction record
            transaction = Transaction(
                user_id=user_id,
                type=TransactionType.CREDIT.value if is_credit else TransactionType.DEBIT.value,
                amount=amount,
                reference_type='adjustment',
                reference_id=f"admin_{admin_id}",
                meta_data={
                    'reason': reason,
                    'admin_id': admin_id
                }
            )
            db.session.add(transaction)
            db.session.flush()

            try:
                if is_credit:
                    balance.credit(amount)
                else:
                    if not balance.can_debit(amount):
                        transaction.fail("Insufficient balance")
                        return None, "Insufficient balance"
                    balance.debit(amount)

                transaction.complete(balance.available_amount)
                cls.log_event(transaction.id, 'admin_adjustment', 'success', {
                    'admin_id': admin_id,
                    'reason': reason
                })
                
                return transaction, None
                
            except ValueError as e:
                transaction.fail(str(e))
                cls.log_event(transaction.id, 'admin_adjustment', 'failed', {
                    'error': str(e)
                })
                return None, str(e)

        except Exception as e:
            logger.error(f"Error in admin_adjust_balance: {str(e)}", exc_info=True)
            if 'transaction' in locals():
                cls.log_event(transaction.id, 'admin_adjustment', 'failed', {
                    'error': str(e)
                })
            return None, f"Error adjusting balance: {str(e)}"
        
    @classmethod
    @BasePaymentService.handle_transaction
    def process_reservation(
        cls,
        user_id: int,
        reservation_id: int
    ) -> Tuple[Optional[Transaction], Optional[str]]:
        """Process payment for ticket reservation"""
        try:
            # Get and validate reservation
            reservation = TicketReservation.query.filter_by(
                id=reservation_id,
                user_id=user_id,
                status=ReservationStatus.PENDING
            ).first()
            
            if not reservation:
                return None, "Reservation not found or not in pending status"

            # Ensure timezone-aware comparison
            now = datetime.now(timezone.utc)
            expires_at = reservation.expires_at.replace(tzinfo=timezone.utc) if reservation.expires_at.tzinfo is None else reservation.expires_at

            # Check expiration
            if now > expires_at:
                return None, "Reservation has expired"

            # Get/Validate balance
            balance, error = cls.get_or_create_balance(user_id)
            if error:
                return None, error

            if not balance.can_debit(reservation.total_amount):
                return None, "Insufficient balance"

            # Create payment transaction
            transaction = Transaction(
                user_id=user_id,
                type=TransactionType.DEBIT.value,
                amount=reservation.total_amount,
                reference_type=ReferenceType.TICKET_PURCHASE.value,
                reference_id=f"raffle_{reservation.raffle_id}",
                meta_data={
                    'reservation_id': reservation.id,
                    'ticket_ids': reservation.ticket_ids,
                    'notes': f"Ticket purchase for raffle {reservation.raffle_id}"
                }
            )
            db.session.add(transaction)
            db.session.flush()

            try:
                # Process payment
                balance.debit(reservation.total_amount)
                
                # Complete transaction (this will create credit transaction)
                transaction.complete(balance.available_amount)
                
                # Update tickets status to sold using credit transaction ID
                Ticket.query.filter(
                    Ticket.ticket_id.in_(reservation.ticket_ids)
                ).update({
                    'status': TicketStatus.SOLD.value,
                    'transaction_id': transaction.credit_transaction_id,
                    'purchase_time': datetime.now(timezone.utc)
                }, synchronize_session=False)

                # Complete reservation
                reservation.complete(transaction.credit_transaction_id)
                
                cls.log_event(transaction.id, 'purchase_complete', 'success')
                
                db.session.commit()
                return transaction, None

            except ValueError as e:
                transaction.fail(str(e))
                cls.log_event(transaction.id, 'process_payment', 'failed', {'error': str(e)})
                return None, str(e)

        except Exception as e:
            db.session.rollback()
            logger.error(f"Error processing reservation: {str(e)}")
            if 'transaction' in locals():
                cls.log_event(transaction.id, 'process_reservation', 'failed', {'error': str(e)})
            return None, str(e)