/**
 * FilterBar Component
 * 
 * Provides intuitive filtering controls with:
 * - Status-based filtering
 * - Responsive layout adaptation
 * - Touch-optimized interactions
 * - Smooth animation states
 */

import { FC, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Filter, ChevronDown } from 'lucide-react';
import { TicketStatus } from '../../../../features/tickets/types';
import type { TicketFilters } from '../../../../features/tickets/types';

interface FilterBarProps {
  className?: string;
  onFilterChange: (filters: TicketFilters) => void;
}

const FilterBar: FC<FilterBarProps> = ({
  className = '',
  onFilterChange
}) => {
  // Predefined filter options
  const statusFilters = useMemo(() => [
    { 
      value: TicketStatus.SOLD, 
      label: 'Not Revealed',
      description: 'Tickets ready for reveal'
    },
    { 
      value: TicketStatus.REVEALED, 
      label: 'Revealed',
      description: 'Tickets with revealed outcomes'
    },
    { 
      value: TicketStatus.RESERVED, 
      label: 'Reserved',
      description: 'Pending purchase completion'
    }
  ], []);

  return (
    <div className={`flex items-center gap-2 overflow-x-auto ${className}`}>
      {/* Filter Trigger */}
      <motion.button
        whileTap={{ scale: 0.95 }}
        className="inline-flex items-center px-3 py-2 text-sm font-medium 
                  rounded-lg bg-white border border-gray-200 text-gray-700
                  shadow-sm hover:bg-gray-50 touch-manipulation"
      >
        <Filter className="w-4 h-4 mr-2" />
        <span>Filter</span>
        <ChevronDown className="w-4 h-4 ml-2" />
      </motion.button>
      
      {/* Quick Filters - Desktop */}
      <div className="hidden md:flex items-center gap-2">
        {statusFilters.map(({ value, label, description }) => (
          <motion.button
            key={value}
            whileTap={{ scale: 0.95 }}
            className="group relative px-3 py-2 text-sm font-medium rounded-lg 
                     bg-white border border-gray-200 text-gray-700
                     hover:bg-gray-50 touch-manipulation"
            onClick={() => onFilterChange({ status: [value] })}
          >
            {label}
            {/* Tooltip */}
            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1
                          bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100
                          transition-opacity pointer-events-none">
              {description}
            </div>
          </motion.button>
        ))}

        {/* Instant Win Filter */}
        <motion.button
          whileTap={{ scale: 0.95 }}
          className="px-3 py-2 text-sm font-medium rounded-lg 
                   bg-white border border-gray-200 text-green-700
                   hover:bg-green-50 touch-manipulation"
          onClick={() => onFilterChange({ instant_win_eligible: true })}
        >
          Instant Win
        </motion.button>
      </div>
    </div>
  );
};

export default FilterBar;