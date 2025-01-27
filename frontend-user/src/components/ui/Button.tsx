// src/components/ui/Button.tsx
import { forwardRef, ReactNode } from 'react';
import { motion, type HTMLMotionProps } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

interface ButtonBaseProps {
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  fullWidth?: boolean;
  children: ReactNode;
}

type ButtonProps = ButtonBaseProps & Omit<HTMLMotionProps<'button'>, 'children'>;

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(({
  className,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  fullWidth = false,
  children,
  ...props
}, ref) => {
  const baseStyles = 'relative inline-flex items-center justify-center rounded-lg font-medium transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';
  
  const variants = {
    primary: 'bg-game-500 text-white hover:bg-game-600 focus:ring-game-500/50',
    secondary: 'bg-game-600 text-white hover:bg-game-700 focus:ring-game-500/50',
    ghost: 'bg-transparent hover:bg-surface-hover text-gray-300 hover:text-white'
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg'
  };

  return (
    <motion.button
      ref={ref}
      whileTap={{ scale: 0.98 }}
      className={cn(
        baseStyles,
        variants[variant],
        sizes[size],
        fullWidth && 'w-full',
        className
      )}
      {...props}
    >
      {isLoading && (
        <Loader2 className="absolute left-4 h-4 w-4 animate-spin" />
      )}
      <span>{children}</span>
    </motion.button>
  );
});

Button.displayName = 'Button';