// src/components/features/tickets/shared/PrizeDisplay.tsx

import { FC, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, DollarSign, CreditCard, Gift } from 'lucide-react';
import { PrizeType } from '../../../../features/tickets/types';
import type { Prize } from '../../../../features/tickets/types';

interface PrizeDisplayProps {
  prize: Prize;
  isRevealed: boolean;
  className?: string;
  isMobile?: boolean;
}

const PrizeDisplay: FC<PrizeDisplayProps> = memo(({
  prize,
  isRevealed,
  className = '',
  isMobile = false
}) => {
  // Hardware-accelerated reveal animation configuration
  const containerVariants = {
    hidden: { 
      opacity: 0,
      y: isMobile ? 20 : 0,
      scale: isMobile ? 0.95 : 1
    },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        type: "spring",
        stiffness: 400,
        damping: 30
      }
    }
  };

  // Value indicators with platform-specific layout adaptations
  const valueIcons = {
    cash: DollarSign,
    credit: CreditCard,
    retail: Trophy
  };

  // Prize type configuration with mobile-optimized presentation
  const prizeTypeStyles = {
    [PrizeType.INSTANT_WIN]: {
      icon: Gift,
      label: 'Instant Win',
      className: 'bg-green-100 text-green-800'
    },
    [PrizeType.DRAW_WIN]: {
      icon: Trophy,
      label: 'Draw Win',
      className: 'bg-indigo-100 text-indigo-800'
    },
    [PrizeType.NO_WIN]: {
      icon: Trophy,
      label: 'No Win',
      className: 'bg-gray-100 text-gray-800'
    }
  };

  return (
    <AnimatePresence mode="wait">
      {isRevealed && (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          exit="hidden"
          className={`
            space-y-3 transform-gpu
            ${isMobile ? 'px-4 py-3' : 'p-6'}
            ${className}
          `}
        >
          {/* Prize Type Indicator */}
          <div className={`
            inline-flex items-center px-3 py-1 rounded-full
            text-sm font-medium ${prizeTypeStyles[prize.type].className}
          `}>
            {(() => {
              const IconComponent = prizeTypeStyles[prize.type].icon;
              return (
                <>
                  <IconComponent className="w-4 h-4 mr-1.5" />
                  {prizeTypeStyles[prize.type].label}
                </>
              );
            })()}
          </div>

          {/* Prize Title */}
          <h3 className={`
            font-semibold text-gray-900
            ${isMobile ? 'text-lg' : 'text-xl'}
          `}>
            {prize.name}
          </h3>

          {/* Value Breakdown */}
          <div className="space-y-2">
            {Object.entries(prize.values).map(([key, value]) => {
              if (value === 0) return null;
              const ValueIcon = valueIcons[key as keyof typeof valueIcons];
              
              return (
                <div
                  key={key}
                  className={`
                    flex items-center justify-between p-3
                    ${isMobile ? 'bg-gray-50/80' : 'bg-white'}
                    rounded-lg backdrop-blur-sm
                  `}
                >
                  <div className="flex items-center space-x-2">
                    <ValueIcon className="w-5 h-5 text-gray-500" />
                    <span className="text-sm text-gray-600">
                      {key.charAt(0).toUpperCase() + key.slice(1)} Value
                    </span>
                  </div>
                  <span className="font-semibold text-gray-900">
                    ${value.toLocaleString()}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Claim Deadline */}
          {prize.claimDeadline && (
            <p className="text-sm text-gray-500 mt-2">
              Claim by {new Date(prize.claimDeadline).toLocaleDateString()}
            </p>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
});

PrizeDisplay.displayName = 'PrizeDisplay';

export default PrizeDisplay;