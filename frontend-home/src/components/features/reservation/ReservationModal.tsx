import { FC, useState, useCallback } from 'react';
import { X } from 'lucide-react';
import Card from '../../common/Card';
import Button from '../../common/Button';
import TicketSelector from './TicketSelector';
import { ReservationApi } from '../../../api/reservationApi';
import PaymentAPI from '../../../api/paymentApi';
import type { Raffle } from '../../../api/types';
import type { TicketReservation } from '../../../api/types/reservation';
import type { SiteCreditBalance } from '../../../api/types/payment';

interface ReservationModalProps {
  raffle: Raffle;
  isOpen: boolean;
  onClose: () => void;
  onComplete: (reservation: TicketReservation, balance: SiteCreditBalance) => void;
}

const ReservationModal: FC<ReservationModalProps> = ({
  raffle,
  isOpen,
  onClose,
  onComplete
}) => {
  const [quantity, setQuantity] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | undefined>();

  const handleSubmit = useCallback(async () => {
    if (isSubmitting) return;

    try {
      setIsSubmitting(true);
      setError(undefined);

      const [reservationResponse, balanceResponse] = await Promise.all([
        ReservationApi.createReservation(raffle.id, { quantity }),
        PaymentAPI.getBalance()
      ]);

      if (reservationResponse.error || !reservationResponse.data) {
        throw new Error(reservationResponse.error?.message || 'Failed to create reservation');
      }

      if (balanceResponse.error || !balanceResponse.data) {
        throw new Error(balanceResponse.error?.message || 'Failed to fetch balance');
      }

      onComplete(reservationResponse.data.reservation, balanceResponse.data);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  }, [quantity, raffle.id, onComplete, isSubmitting]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div 
        className="fixed inset-0 bg-black/30 backdrop-blur-sm" 
        onClick={onClose}
      />
      
      <Card variant="default" className="relative z-50 w-full max-w-lg mx-4">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Reserve Tickets</h2>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <TicketSelector
            raffle={raffle}
            value={quantity}
            onChange={setQuantity}
            disabled={isSubmitting}
            error={error}
          />
        </div>

        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100">
          <Button
            variant="primary"
            size="lg"
            fullWidth
            onClick={handleSubmit}
            disabled={isSubmitting}
            isLoading={isSubmitting}
          >
            {isSubmitting ? 'Reserving...' : 'Reserve Tickets'}
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default ReservationModal;