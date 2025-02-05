// src/components/features/raffles/RaffleActions.tsx

import { FC, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAtom } from 'jotai';
import Card from '../../common/Card';
import Button from '../../common/Button';
import { Ticket, AlertCircle } from '../../common/icons';
import { motion, AnimatePresence } from 'framer-motion';
import ReservationModal from '../reservation/ReservationModal';
import { useReservation } from '../../../hooks/useReservation';
import { reservationStateAtom } from '../../../stores/reservation';
import type { Raffle } from '../../../api/types';

interface RaffleActionsProps {
  raffle: Raffle;
  className?: string;
}

const RaffleActions: FC<RaffleActionsProps> = ({ raffle, className = '' }) => {
  const navigate = useNavigate();
  const [state] = useAtom(reservationStateAtom);
  const [errorMessage, setErrorMessage] = useState<string | undefined>();

  const {
    isModalOpen,
    openModal,
    closeModal
  } = useReservation({
    raffle,
    onSuccess: () => {
      navigate('/purchase', { 
        state: { 
          raffleId: raffle.id,
          reservationId: state.currentReservation?.id 
        }
      });
    },
    onError: (error) => setErrorMessage(error)
  });

  const handleReserveClick = useCallback(() => {
    setErrorMessage(undefined);
    
    if (raffle.state !== 'open') {
      setErrorMessage('This raffle is not currently open for purchases');
      return;
    }

    if (raffle.available_tickets < 1) {
      setErrorMessage('No tickets available');
      return;
    }

    openModal();
  }, [raffle.state, raffle.available_tickets, openModal]);

  return (
    <>
      {/* Desktop View */}
      <Card variant="default" className={`hidden lg:block ${className}`}>
        <div className="p-6 space-y-6">
          <div className="space-y-2">
            <h2 className="text-xl font-semibold text-gray-900">
              Purchase Tickets
            </h2>
            <p className="text-sm text-gray-600">
              ${raffle.ticket_price.toFixed(2)} per ticket
            </p>
          </div>

          {raffle.state === 'open' ? (
            <div className="space-y-6">
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Available tickets:</span>
                  <span className="font-medium text-gray-900">
                    {raffle.available_tickets.toLocaleString()}
                  </span>
                </div>
              </div>

              <AnimatePresence mode="wait">
                {errorMessage && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm"
                  >
                    {errorMessage}
                  </motion.div>
                )}
              </AnimatePresence>

              <Button
                variant="primary"
                fullWidth
                onClick={handleReserveClick}
                disabled={raffle.available_tickets < 1}
              >
                <Ticket className="w-4 h-4 mr-2" />
                Reserve Tickets
              </Button>
            </div>
          ) : (
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center space-x-3">
                <AlertCircle className="w-5 h-5 text-gray-400" />
                <p className="text-sm text-gray-600">
                  {raffle.state === 'coming_soon' 
                    ? 'Raffle is not yet open for ticket purchases'
                    : 'Raffle is no longer accepting purchases'}
                </p>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Mobile View */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50">
        <div className="bg-white border-t border-gray-200 shadow-xl bg-opacity-95 backdrop-blur-sm">
          <div className="px-6 py-4 flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-sm text-gray-600">Price per ticket</span>
              <span className="text-xl font-bold text-indigo-600">
                ${raffle.ticket_price.toFixed(2)}
              </span>
            </div>
            <Button
              variant="primary"
              size="lg"
              onClick={handleReserveClick}
              disabled={raffle.state !== 'open' || raffle.available_tickets < 1}
              className="min-w-[160px] shadow-lg"
            >
              <Ticket className="w-5 h-5 mr-2" />
              Reserve Now
            </Button>
          </div>
        </div>
      </div>

      {/* Reservation Modal */}
      <ReservationModal
        raffle={raffle}
        isOpen={isModalOpen}
        onClose={closeModal}
        onReservationComplete={() => {
          navigate('/purchase', {
            state: {
              raffleId: raffle.id,
              reservationId: state.currentReservation?.id
            }
          });
        }}
      />
    </>
  );
};

export default RaffleActions;