import React, { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { FlipDirection } from './CardContainer';

// Re-declare locally to ensure consistency
type LocalFlipDirection = 'horizontal' | 'vertical' | 'top-to-bottom' | 'vertical-y' | 'none';

interface CardFaceProps {
  isFront: boolean;
  flipDirection: FlipDirection;
  children: ReactNode;
  className?: string;
}

const CardFace: React.FC<CardFaceProps> = ({
  isFront,
  flipDirection,
  children,
  className = ''
}) => {
  // Determine appropriate CSS classes based on face position and flip direction
  const getFaceClass = () => {
    if (isFront) return 'card-face-front';
    
    // Cast to local type for safer type checking
    const direction = flipDirection as LocalFlipDirection;
    
    // Select the appropriate back face class based on flip direction
    if (direction === 'horizontal') {
      return 'card-face-back';
    } else if (direction === 'vertical') {
      return 'card-face-back-vertical';
    } else if (direction === 'top-to-bottom') {
      return 'card-face-back-top-to-bottom';
    } else if (direction === 'vertical-y') {
      return 'card-face-back-vertical-y';
    } else {
      return 'card-face-back';
    }
  };

  return (
    <motion.div 
      className={`card-face ${getFaceClass()} ${className}`}
      initial={{ opacity: 1 }}
      animate={{ opacity: 1 }}
    >
      {children}
    </motion.div>
  );
};

export default CardFace;