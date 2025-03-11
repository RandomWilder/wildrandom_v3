/**
 * Ticket Group List Container
 * 
 * Implements the main ticket groups display with:
 * - Error boundary integration
 * - Loading state management
 * - Empty state handling
 * - Performance optimizations
 */

import { FC, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTicketGroups } from '../../../../hooks/useTicketGroups';
import { FeatureErrorBoundary } from '../../../common/ErrorBoundary';
import TicketGroupCard from './TicketGroupCard';
import LoadingState from './LoadingState';
import EmptyState from './EmptyState';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

export const TicketGroupList: FC = () => {
  const { groups, isLoading, error, fetchGroups } = useTicketGroups();

  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  return (
    <FeatureErrorBoundary feature="Ticket Groups">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-900">My Tickets</h2>
          {!isLoading && groups.length > 0 && (
            <button 
              onClick={() => fetchGroups()}
              className="text-sm text-indigo-600 hover:text-indigo-700"
            >
              Refresh
            </button>
          )}
        </div>

        {/* Content States */}
        <AnimatePresence mode="wait">
          {isLoading ? (
            <LoadingState />
          ) : error ? (
            <div className="text-red-600 bg-red-50 p-4 rounded-lg">
              {error}
            </div>
          ) : groups.length === 0 ? (
            <EmptyState />
          ) : (
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="space-y-4"
            >
              {groups.map(group => (
                <motion.div
                  key={group.raffle_id}
                  variants={itemVariants}
                  layoutId={`group-${group.raffle_id}`}
                >
                  <TicketGroupCard group={group} />
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </FeatureErrorBoundary>
  );
};

export default TicketGroupList;