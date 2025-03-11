// src/components/features/tickets/shared/LoadingStates/TicketSkeleton.tsx

import { FC, memo } from 'react';
import { motion } from 'framer-motion';
import Card from '../../../../common/Card';

interface TicketSkeletonProps {
  isMobile?: boolean;
  count?: number;
  className?: string;
}

const TicketSkeleton: FC<TicketSkeletonProps> = memo(({
  isMobile = false,
  count = 3,
  className = ''
}) => {
  // Platform-adaptive loading animation for optimal performance
  const shimmerVariants = {
    initial: { x: '-100%' },
    animate: { 
      x: '100%',
      transition: {
        duration: 1.5,
        repeat: Infinity,
        ease: "linear"
      }
    }
  };

  // Touch-optimized skeleton dimensions
  const dimensions = {
    mobile: {
      height: 'h-24',
      padding: 'p-4',
      spacing: 'space-y-2'
    },
    desktop: {
      height: 'h-32',
      padding: 'p-6',
      spacing: 'space-y-3'
    }
  };

  const platform = isMobile ? dimensions.mobile : dimensions.desktop;

  const SingleSkeleton = () => (
    <Card 
      className={`
        relative overflow-hidden 
        ${platform.height} ${platform.padding}
        transform-gpu
      `}
    >
      {/* Background loading pattern */}
      <div className={`flex flex-col ${platform.spacing}`}>
        {/* Ticket number skeleton */}
        <div className="w-24 h-6 bg-gray-200 rounded-md" />
        
        {/* Status indicator skeleton */}
        <div className="w-20 h-4 bg-gray-200 rounded-md" />
        
        {/* Prize placeholder (if applicable) */}
        <div className="w-32 h-5 bg-gray-200 rounded-md" />
      </div>

      {/* Shimmer effect overlay */}
      <motion.div
        variants={shimmerVariants}
        initial="initial"
        animate="animate"
        className="absolute inset-0 
                   bg-gradient-to-r from-transparent 
                   via-white/20 to-transparent
                   transform-gpu"
        style={{ 
          willChange: 'transform',
          backfaceVisibility: 'hidden' 
        }}
      />
    </Card>
  );

  return (
    <div className={`space-y-3 ${className}`}>
      {Array.from({ length: count }).map((_, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 20 }}
          animate={{ 
            opacity: 1, 
            y: 0,
            transition: {
              delay: index * 0.1
            }
          }}
        >
          <SingleSkeleton />
        </motion.div>
      ))}
    </div>
  );
});

TicketSkeleton.displayName = 'TicketSkeleton';

export default TicketSkeleton;