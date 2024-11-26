# src/payment_service/services/__init__.py

from .core_service import CorePaymentService

# Create aliases for backward compatibility
PaymentService = CorePaymentService
BalanceService = CorePaymentService
AuditService = CorePaymentService

__all__ = [
    'CorePaymentService',
    'PaymentService',
    'BalanceService',
    'AuditService'
]