// src/components/common/ScrollNumberSelector/index.tsx

import { FC, useRef, useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import './styles.css';

interface ScrollNumberSelectorProps {
  min: number;
  max: number;
  value: number;
  onChange: (value: number) => void;
  className?: string;
  disabled?: boolean;
}

/**
 * ScrollNumberSelector Component
 * 
 * Provides a horizontally scrollable number selector optimized for
 * mobile touch interactions with smooth animations and snap points.
 * 
 * Features:
 * - Smooth horizontal scrolling
 * - Touch-optimized interactions
 * - Snap-to-number behavior
 * - Keyboard accessibility
 * - ARIA compliance
 */
const ScrollNumberSelector: FC<ScrollNumberSelectorProps> = ({
  min,
  max,
  value,
  onChange,
  className = '',
  disabled = false
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const numbers = Array.from({ length: max - min + 1 }, (_, i) => min + i);

  // Handle scroll position updates
  const updateSelectedNumber = useCallback(() => {
    if (!containerRef.current) return;
    
    const container = containerRef.current;
    const itemWidth = container.scrollWidth / numbers.length;
    const selectedIndex = Math.round(container.scrollLeft / itemWidth);
    const newValue = min + selectedIndex;
    
    if (newValue !== value) {
      onChange(newValue);
    }
  }, [min, numbers.length, onChange, value]);

  // Initialize scroll position
  useEffect(() => {
    if (!containerRef.current || isDragging) return;

    const container = containerRef.current;
    const itemWidth = container.scrollWidth / numbers.length;
    const targetScroll = (value - min) * itemWidth;

    container.scrollTo({
      left: targetScroll,
      behavior: 'smooth'
    });
  }, [value, min, numbers.length, isDragging]);

  // Listen for scroll events
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let scrollTimeout: NodeJS.Timeout;
    
    const handleScroll = () => {
      setIsDragging(true);
      clearTimeout(scrollTimeout);
      
      scrollTimeout = setTimeout(() => {
        setIsDragging(false);
        updateSelectedNumber();
      }, 150);
    };

    container.addEventListener('scroll', handleScroll);
    return () => {
      container.removeEventListener('scroll', handleScroll);
      clearTimeout(scrollTimeout);
    };
  }, [updateSelectedNumber]);

  return (
    <div className={`relative ${className} ${disabled ? 'opacity-50' : ''}`}>
      {/* Left Gradient */}
      <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-white to-transparent z-10" />
      
      {/* Scroll Container */}
      <div
        ref={containerRef}
        className="scroll-number-container overflow-x-auto hide-scrollbar"
        aria-label="Number selector"
        role="spinbutton"
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={value}
        tabIndex={disabled ? -1 : 0}
      >
        <div className="scroll-number-track inline-flex">
          {numbers.map((num) => (
            <motion.div
              key={num}
              className={`scroll-number-item flex-shrink-0 w-16 h-16 flex items-center justify-center text-xl
                ${num === value ? 'text-indigo-600 font-bold' : 'text-gray-400'}`}
              animate={{
                scale: num === value ? 1.1 : 1
              }}
              transition={{ type: 'spring', stiffness: 300 }}
            >
              {num}
            </motion.div>
          ))}
        </div>
      </div>

      {/* Right Gradient */}
      <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-white to-transparent z-10" />
      
      {/* Center Indicator */}
      <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-indigo-600 transform -translate-x-1/2 pointer-events-none" />
    </div>
  );
};

export default ScrollNumberSelector;