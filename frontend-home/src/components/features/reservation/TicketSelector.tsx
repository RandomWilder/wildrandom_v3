// src/components/features/reservation/TicketSelector.tsx

import { FC, useState } from 'react';
import Input from '../../common/Input';
import ScrollNumberSelector from '../../common/ScrollNumberSelector';
import { DollarSign, Ticket } from '../../common/icons';
import type { Raffle } from '../../../api/types';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Props interface for the TicketSelector component
 * Implements controlled component pattern with explicit value/onChange
 */
interface TicketSelectorProps {
  raffle: Raffle;
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
  error?: string;
}

/**
 * TicketSelector Component
 * 
 * Handles ticket quantity selection with validation and responsive UI.
 * Implements both mobile (scroll) and desktop (input) interfaces.
 * 
 * @param props {@link TicketSelectorProps}
 */
const TicketSelector: FC<TicketSelectorProps> = ({
  raffle,
  value,
  onChange,
  disabled = false,
  error
}) => {
  const [localError, setLocalError] = useState<string | undefined>(error);

  const handleQuantityChange = (newValue: number) => {
    setLocalError(undefined);

    if (newValue > raffle.available_tickets) {
      setLocalError(`Only ${raffle.available_tickets} tickets available`);
      return;
    }

    if (newValue > raffle.max_tickets_per_user) {
      setLocalError(`Maximum ${raffle.max_tickets_per_user} tickets per user`);
      return;
    }

    onChange(newValue);
  };

  // Calculate total cost based on current quantity
  const totalCost = value * raffle.ticket_price;

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          Number of Tickets
        </label>

        {/* Mobile Scroll Selector */}
        <div className="lg:hidden">
          <ScrollNumberSelector
            min={1}
            max={Math.min(raffle.available_tickets, raffle.max_tickets_per_user)}
            value={value}
            onChange={handleQuantityChange}
            disabled={disabled}
          />
        </div>

        {/* Desktop Input */}
        <div className="hidden lg:block relative">
          <Input
            type="number"
            min={1}
            max={Math.min(raffle.available_tickets, raffle.max_tickets_per_user)}
            value={value}
            onChange={(e) => handleQuantityChange(parseInt(e.target.value, 10))}
            state={localError || error ? "error" : "default"}
            error={localError || error}
            disabled={disabled}
            className="pl-10"
          />
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Ticket className="h-5 w-5 text-gray-400" />
          </div>
        </div>

        <AnimatePresence>
          {!error && !localError && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex justify-between items-center text-sm text-gray-600"
            >
              <span>Available tickets:</span>
              <span className="font-medium">{raffle.available_tickets.toLocaleString()}</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Cost Summary */}
      <div className="bg-indigo-50/80 rounded-xl p-4 space-y-3">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Cost per ticket</span>
          <div className="flex items-center space-x-1">
            <DollarSign className="h-4 w-4 text-indigo-600" />
            <span className="font-medium text-indigo-600">
              {raffle.ticket_price.toFixed(2)}
            </span>
          </div>
        </div>
        
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Quantity</span>
          <span className="font-medium text-indigo-600">{value}</span>
        </div>

        <div className="pt-3 border-t border-indigo-100">
          <div className="flex justify-between items-center">
            <span className="text-base font-medium text-gray-900">Total Cost</span>
            <div className="flex items-center space-x-1">
              <DollarSign className="h-5 w-5 text-indigo-700" />
              <span className="text-lg font-bold text-indigo-700">
                {totalCost.toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TicketSelector;