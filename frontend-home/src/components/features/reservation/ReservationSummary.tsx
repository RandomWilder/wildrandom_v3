// src/components/features/reservation/ReservationSummary.tsx

import { FC, useEffect, useState } from 'react';
import { useAtom } from 'jotai';
import { motion } from 'framer-motion';
import { Timer, AlertCircle } from '../../common/icons';
import { 
  reservationStateAtom,
  reservationTimeRemainingAtom,
  clearReservationAtom 
} from '../../../stores/reservation';
import { useInterval } from '../../../hooks/useInterval';

interface ReservationSummaryProps {
  onExpired?: () => void;
}

/**
 * ReservationSummary Component
 * 
 * Displays active reservation details with real-time countdown timer
 * and automatic expiry handling. Implements smooth transitions and
 * error states.
 * 
 * @component
 * @example
 * ```tsx
 * <ReservationSummary onExpired={handleExpiry} />
 * ```
 */
const ReservationSummary: FC<ReservationSummaryProps> = ({ onExpired }) => {
  const [state] = useAtom(reservationStateAtom);
  const [timeRemaining] = useAtom(reservationTimeRemainingAtom);
  const [, clearReservation] = useAtom(clearReservationAtom);
  const [formattedTime, setFormattedTime] = useState<string>('');

  // Format remaining time
  useEffect(() => {
    const minutes = Math.floor(timeRemaining / 60);
    const seconds = timeRemaining % 60;
    setFormattedTime(`${minutes}:${seconds.toString().padStart(2, '0')}`);
  }, [timeRemaining]);

  // Check for expiry every second
  useInterval(() => {
    if (timeRemaining === 0) {
      clearReservation();
      onExpired?.();
    }
  }, 1000);

  if (!state.currentReservation) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="rounded-xl border border-indigo-100 bg-gradient-to-b from-indigo-50/50 to-white p-4"
    >
      <div className="space-y-4">
        {/* Timer Section */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <Timer className="h-4 w-4 text-indigo-600" />
            <span>Time Remaining:</span>
          </div>
          <div className={`font-mono font-medium ${
            timeRemaining < 30 ? 'text-red-600' : 'text-indigo-600'
          }`}>
            {formattedTime}
          </div>
        </div>

        {/* Reservation Details */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Tickets Reserved:</span>
            <span className="font-medium">
              {state.currentReservation.ticket_ids.length}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Total Amount:</span>
            <span className="font-medium">
              ${state.currentReservation.total_amount.toFixed(2)}
            </span>
          </div>
        </div>

        {/* Warning for low time */}
        {timeRemaining < 30 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center space-x-2 text-sm text-red-600 bg-red-50 rounded-lg p-3"
          >
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <span>Reservation expiring soon!</span>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};

export default ReservationSummary;