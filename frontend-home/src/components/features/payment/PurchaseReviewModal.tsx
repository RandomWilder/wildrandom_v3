import { FC, useMemo } from 'react';
import { X, Wallet, CreditCard } from 'lucide-react';
import Card from '../../common/Card';
import Button from '../../common/Button';
import { PaymentMethod } from '../../../types/purchase-flow';
import { usePurchaseFlow } from '../../../stores/purchase-flow';

interface PurchaseReviewModalProps {
  isOpen: boolean;
  onConfirm: (method: PaymentMethod) => void;
  onClose: () => void;
}

const PurchaseReviewModal: FC<PurchaseReviewModalProps> = ({
  isOpen,
  onConfirm,
  onClose
}) => {
  const { state } = usePurchaseFlow();
  const { reservation, balance } = state;

  // Compute payment availability status with null safety
  const paymentStatus = useMemo(() => {
    if (!reservation?.total_amount || !balance?.available_balance) {
      return {
        siteCreditAvailable: false,
        requiredAmount: 0,
        availableBalance: 0
      };
    }

    return {
      siteCreditAvailable: balance.available_balance >= reservation.total_amount,
      requiredAmount: reservation.total_amount,
      availableBalance: balance.available_balance
    };
  }, [reservation, balance]);

  // Early return if critical data is missing
  if (!isOpen || !reservation || !balance || !paymentStatus) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div 
        className="fixed inset-0 bg-black/30 backdrop-blur-sm" 
        onClick={onClose}
      />
      
      <Card variant="default" className="relative z-50 w-full max-w-lg mx-4">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Complete Purchase</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Transaction Summary */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-medium text-gray-900 mb-3">Purchase Summary</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Tickets</span>
                <span className="font-medium">{reservation.ticket_count}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Total Amount</span>
                <span className="font-medium">
                  ${paymentStatus.requiredAmount.toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {/* Payment Methods */}
          <div className="space-y-4">
            <Button
              variant="primary"
              fullWidth
              onClick={() => onConfirm(PaymentMethod.SITE_CREDIT)}
              disabled={!paymentStatus.siteCreditAvailable}
              className="flex items-center justify-center"
            >
              <Wallet className="w-5 h-5 mr-2" />
              <span>Pay with Site Credit</span>
            </Button>
            
            {!paymentStatus.siteCreditAvailable && (
              <div className="text-sm text-amber-600 bg-amber-50 p-3 rounded-lg">
                Insufficient balance (${paymentStatus.availableBalance.toFixed(2)} available)
              </div>
            )}

            <Button
              variant="secondary"
              fullWidth
              onClick={() => onConfirm(PaymentMethod.EXTERNAL)}
              className="flex items-center justify-center"
            >
              <CreditCard className="w-5 h-5 mr-2" />
              <span>Use External Payment</span>
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default PurchaseReviewModal;