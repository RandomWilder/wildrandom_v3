// src/components/features/tickets/TicketList/EmptyStates.tsx

import { FC } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import Card from '../../../common/Card';

interface EmptyStateProps {
  className?: string;
  onRetry?: () => void;
}

interface ErrorStateProps extends EmptyStateProps {
  error: string;
}

const NoTickets: FC<EmptyStateProps> = ({ className = '' }) => (
  <Card className={`p-6 ${className}`}>
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="text-center"
    >
      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        No Tickets Found
      </h3>
      <p className="text-gray-600 text-sm">
        Begin your gaming journey by purchasing tickets from our active raffles.
      </p>
    </motion.div>
  </Card>
);

const Error: FC<ErrorStateProps> = ({ error, onRetry, className = '' }) => (
  <Card className={`p-6 ${className}`}>
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="text-center"
    >
      <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto mb-4" />
      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        Unable to Load Tickets
      </h3>
      <p className="text-gray-600 text-sm mb-4">
        {error}
      </p>
      {onRetry && (
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={onRetry}
          className="inline-flex items-center px-4 py-2 
                   text-sm font-medium text-indigo-600 
                   bg-indigo-50 rounded-lg touch-manipulation"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Try Again
        </motion.button>
      )}
    </motion.div>
  </Card>
);

const EmptyStates = {
  NoTickets,
  Error
};

export default EmptyStates;