import React, { ReactNode } from 'react';
import './styles.css';

// Define the string literals as a union type for better type propagation
export type FlipDirection = 'horizontal' | 'vertical' | 'top-to-bottom' | 'vertical-y' | 'none';

interface CardContainerProps {
  isFlipped: boolean;
  flipDirection: FlipDirection;
  children: ReactNode;
  className?: string;
}

const CardContainer: React.FC<CardContainerProps> = ({
  isFlipped,
  flipDirection,
  children,
  className = ''
}) => {
  const getFlippedClass = () => {
    if (!isFlipped) return '';
    
    // Return appropriate CSS class based on flip direction
    switch (flipDirection) {
      case 'horizontal':
        return 'flipped-horizontal';
      case 'vertical':
        return 'flipped-vertical';
      case 'top-to-bottom':
        return 'flipped-top-to-bottom';
      case 'vertical-y':
        return 'flipped-vertical-y';
      default:
        return '';
    }
  };

  return (
    <div className={`ticket-card-container ${className}`}>
      <div className={`ticket-card ${getFlippedClass()}`}>
        {children}
      </div>
    </div>
  );
};

export default CardContainer;