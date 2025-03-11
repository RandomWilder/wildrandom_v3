import { FC, memo } from 'react';
import { motion } from 'framer-motion';
import Card from '../../../common/Card';

interface LoadingStateProps {
  count?: number;
  className?: string;
}

const LoadingState: FC<LoadingStateProps> = memo(({
  count = 3,
  className = ''
}) => {
  return (
    <div className={`space-y-4 ${className}`}>
      {Array.from({ length: count }).map((_, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
        >
          <Card className="p-4">
            <div className="space-y-3 animate-pulse">
              {/* Title Skeleton */}
              <div className="flex justify-between items-start">
                <div className="h-6 bg-gray-200 rounded w-3/4"></div>
                <div className="h-6 bg-gray-200 rounded w-20"></div>
              </div>

              {/* Progress Bar Skeleton */}
              <div className="space-y-2">
                <div className="h-2 bg-gray-200 rounded-full"></div>
                <div className="flex justify-between">
                  <div className="h-4 bg-gray-200 rounded w-20"></div>
                  <div className="h-4 bg-gray-200 rounded w-16"></div>
                </div>
              </div>

              {/* Footer Skeleton */}
              <div className="pt-2 border-t border-gray-100 flex justify-between">
                <div className="h-4 bg-gray-200 rounded w-24"></div>
                <div className="h-4 bg-gray-200 rounded w-20"></div>
              </div>
            </div>
          </Card>
        </motion.div>
      ))}
    </div>
  );
});

LoadingState.displayName = 'LoadingState';

export default LoadingState;