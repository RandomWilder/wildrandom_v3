/**
 * Empty State Component
 * 
 * Displays when user has no tickets, providing:
 * - Clear user feedback
 * - Call-to-action
 * - Consistent styling patterns
 */

import { FC } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Ticket } from 'lucide-react';
import Card from '../../../common/Card';
import Button from '../../../common/Button';

const EmptyState: FC = () => {
  const navigate = useNavigate();

  return (
    <Card className="py-12 px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center text-center"
      >
        <div className="rounded-full bg-gray-100 p-3 mb-4">
          <Ticket className="w-8 h-8 text-gray-400" />
        </div>

        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          No Tickets Found
        </h3>
        
        <p className="text-gray-500 mb-6 max-w-sm">
          Start your winning journey by exploring our active raffles and securing your tickets.
        </p>

        <Button
          variant="primary"
          onClick={() => navigate('/raffles')}
        >
          Browse Active Raffles
        </Button>
      </motion.div>
    </Card>
  );
};

export default EmptyState;