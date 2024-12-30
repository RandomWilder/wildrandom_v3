// frontend/admin/src/components/shared/ValueDisplay.tsx

import { DollarSign, TrendingUp, TrendingDown } from 'lucide-react';
import { cn, formatCurrency } from '@/lib/utils';

interface ValueDisplayProps {
  label: string;
  value: number;
  prefix?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function ValueDisplay({ 
  label, 
  value, 
  prefix = '$', 
  trend, 
  size = 'md',
  className 
}: ValueDisplayProps) {
  const formattedValue = new Intl.NumberFormat('en-US', {
    style: 'decimal',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  }).format(value);

  const sizes = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg'
  };

  return (
    <div className={cn('space-y-1', className)}>
      <p className={cn(
        'text-gray-500 font-medium',
        sizes[size]
      )}>
        {label}
      </p>
      <div className="flex items-center space-x-2">
        <div className="flex items-center">
          <DollarSign className="w-4 h-4 text-gray-400 mr-1" />
          <span className={cn(
            'font-semibold text-gray-900',
            {
              'text-lg': size === 'sm',
              'text-xl': size === 'md',
              'text-2xl': size === 'lg'
            }
          )}>
            {formattedValue}
          </span>
        </div>
        {trend && (
          <div className={cn(
            'flex items-center text-sm font-medium',
            trend.isPositive ? 'text-green-600' : 'text-red-600'
          )}>
            {trend.isPositive ? (
              <TrendingUp className="w-4 h-4 mr-1" />
            ) : (
              <TrendingDown className="w-4 h-4 mr-1" />
            )}
            {trend.value}%
          </div>
        )}
      </div>
    </div>
  );
}