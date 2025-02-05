// src/components/features/reservation/ReservationModal.tsx

import { FC, useState, useCallback } from 'react';
import { useAtom } from 'jotai';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from '../../common/icons';
import Button from '../../common/Button';
import TicketSelector from './TicketSelector';
import ReservationSummary from './ReservationSummary';
import { reservationStateAtom, clearReservationAtom } from '../../../stores/reservation';
import type { Raffle } from '../../../api/types';
import { reservationApi } from '../../../api/reservationApi';
import { isReservationError } from '../../../api/types/reservation';

interface ReservationModalProps {
  raffle: Raffle;
  isOpen: boolean;
  onClose: () => void;
  onReservationComplete: () => void;
}

/**
 * ReservationModal Component
 * 
 * Primary container for the ticket reservation flow. Handles:
 * - Ticket quantity selection
 * - Reservation creation
 * - Error management
 * - Expiry handling
 * - State transitions
 * 
 * @component
 */
const ReservationModal: FC<ReservationModalProps> = ({
  raffle,
  isOpen,
  onClose,
  onReservationComplete
}) => {
  const [state, setState] = useAtom(reservationStateAtom);
  const [, clearReservation] = useAtom(clearReservationAtom);
  const [quantity, setQuantity] = useState<number>(1);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Handle reservation creation
  const handleCreateReservation = useCallback(async () => {
    setError(null);
    setIsSubmitting(true);

    try {
      const response = await reservationApi.createReservation(raffle.id, {
        quantity
      });

      if (isReservationError(response)) {
        setError(response.error);
        return;
      }

      // Store reservation details
      setState({
        currentReservation: response.reservation,
        isLoading: false,
        error: null,
        expiryTimestamp: new Date(response.reservation.expires_at).getTime()
      });

      onReservationComplete();

    } catch (err) {
      setError('Failed to create reservation. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }, [raffle.id, quantity, setState, onReservationComplete]);

  // Handle modal close with cleanup
  const handleClose = useCallback(() => {
    setError(null);
    setQuantity(1);
    if (state.currentReservation) {
      clearReservation();
    }
    onClose();
  }, [state.currentReservation, clearReservation, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed inset-x-4 bottom-4 md:inset-auto md:top-[10%] md:left-1/2 md:-translate-x-1/2 md:max-w-lg md:w-full z-50"
          >
            <div className="bg-white rounded-xl shadow-xl overflow-hidden">
              {/* Header */}
              <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">
                  Reserve Tickets
                </h2>
                <button
                  onClick={handleClose}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              {/* Content */}
              <div className="p-6 space-y-6">
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-red-50 text-red-600 px-4 py-3 rounded-lg flex items-start"
                  >
                    <span className="text-sm">{error}</span>
                  </motion.div>
                )}

                {state.currentReservation ? (
                  <ReservationSummary 
                    onExpired={() => {
                      setError('Reservation expired. Please try again.');
                      clearReservation();
                    }}
                  />
                ) : (
                  <TicketSelector
                    raffle={raffle}
                    onChange={setQuantity}
                    disabled={isSubmitting}
                  />
                )}
              </div>

              {/* Footer */}
              <div className="px-6 py-4 bg-gray-50 border-t border-gray-100">
                <Button
                  variant="primary"
                  fullWidth
                  size="lg"
                  onClick={handleCreateReservation}
                  disabled={isSubmitting || !!state.currentReservation}
                  isLoading={isSubmitting}
                >
                  {state.currentReservation ? 'Reserved' : 'Reserve Tickets'}
                </Button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default ReservationModal;