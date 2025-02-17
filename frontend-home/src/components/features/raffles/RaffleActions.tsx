import { FC, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../../../components/common/Button';
import { Ticket } from '../../../components/common/icons';
import { PurchaseFlowStep, PaymentMethod } from '../../../types/purchase-flow';
import { usePurchaseFlow } from '../../../stores/purchase-flow';
import ReservationModal from '../reservation/ReservationModal';
import PurchaseReviewModal from '../payment/PurchaseReviewModal';
import PurchaseModal from '../payment/PurchaseModal';
import type { Raffle } from '../../../api/types';
import type { TicketReservation } from '../../../api/types/reservation';
import type { SiteCreditBalance } from '../../../api/types/payment';

interface RaffleActionsProps {
  raffle: Raffle;
  className?: string;
}

const RaffleActions: FC<RaffleActionsProps> = ({ raffle, className = '' }) => {
  const navigate = useNavigate();
  const { state, dispatch } = usePurchaseFlow();

  const handleStartReservation = useCallback(() => {
    dispatch({ type: 'SET_STEP', payload: PurchaseFlowStep.RESERVATION });
  }, [dispatch]);

  const handleReservationComplete = useCallback((
    reservation: TicketReservation,
    balance: SiteCreditBalance
  ) => {
    dispatch({ type: 'SET_RESERVATION', payload: reservation });
    dispatch({ type: 'SET_BALANCE', payload: balance });
    dispatch({ type: 'SET_STEP', payload: PurchaseFlowStep.REVIEW });
  }, [dispatch]);

  const handlePaymentMethodSelect = useCallback((method: PaymentMethod) => {
    dispatch({ type: 'SET_PAYMENT_METHOD', payload: method });
    dispatch({ type: 'SET_STEP', payload: PurchaseFlowStep.PROCESSING });
  }, [dispatch]);

  const handlePurchaseComplete = useCallback((transactionId: number) => {
    navigate('/profile/purchases', { 
      state: { transactionId, success: true }
    });
  }, [navigate]);

  const handleError = useCallback((errorMessage: string) => {
    dispatch({ type: 'SET_ERROR', payload: errorMessage });
  }, [dispatch]);

  const handleCancel = useCallback(() => {
    dispatch({ type: 'RESET' });
  }, [dispatch]);

  return (
    <>
      {/* Desktop Card - Hidden on Mobile */}
      <div className="hidden lg:block">
        <div className={`bg-white rounded-xl shadow-sm ${className}`}>
          <div className="p-6 space-y-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Purchase Tickets</h3>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Available Tickets</span>
                  <span className="font-medium text-gray-900">
                    {raffle.available_tickets.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center mt-2">
                  <span className="text-gray-600">Price per Ticket</span>
                  <span className="font-medium text-gray-900">
                    ${raffle.ticket_price.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            <Button
              variant="primary"
              fullWidth
              onClick={handleStartReservation}
              disabled={!raffle.available_tickets}
            >
              <div className="flex items-center justify-center">
                <Ticket className="w-4 h-4 mr-2" />
                <span>Reserve Tickets</span>
              </div>
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Sticky Banner - Hidden on Desktop */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 p-4 shadow-lg">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-sm text-gray-600">Price per ticket</span>
            <span className="text-lg font-bold text-gray-900">
              ${raffle.ticket_price.toFixed(2)}
            </span>
          </div>
          <Button
            variant="primary"
            onClick={handleStartReservation}
            disabled={!raffle.available_tickets}
          >
            <div className="flex items-center justify-center">
              <Ticket className="w-4 h-4 mr-2" />
              <span>Reserve Tickets</span>
            </div>
          </Button>
        </div>
      </div>

      {/* Modals */}
      {state.step === PurchaseFlowStep.RESERVATION && (
        <ReservationModal
          raffle={raffle}
          isOpen={true}
          onClose={handleCancel}
          onComplete={handleReservationComplete}
        />
      )}

      {state.step === PurchaseFlowStep.REVIEW && (
        <PurchaseReviewModal
          isOpen={true}
          onConfirm={handlePaymentMethodSelect}
          onClose={handleCancel}
        />
      )}

      {state.step === PurchaseFlowStep.PROCESSING && (
        <PurchaseModal
          isOpen={true}
          onComplete={handlePurchaseComplete}
          onError={handleError}
        />
      )}
    </>
  );
};

export default RaffleActions;