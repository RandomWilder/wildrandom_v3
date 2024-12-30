import React from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  AlertCircle,
  Clock,
  DollarSign,
  type LucideIcon 
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/utils/currency';

interface CreditStateConfig {
  icon: LucideIcon;
  baseClass: string;
  label: string;
  description: string;
}

interface CreditBadgeProps {
  amount: number;
  pending?: number;
  showIcon?: boolean;
  showIndicator?: boolean;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'outline';
  className?: string;
}

// Credit state configuration
const CREDIT_STATES: Record<string, CreditStateConfig> = {
  positive: {
    icon: TrendingUp,
    baseClass: 'text-green-700 bg-green-50 hover:bg-green-50',
    label: 'Available',
    description: 'Available credits'
  },
  negative: {
    icon: TrendingDown,
    baseClass: 'text-red-700 bg-red-50 hover:bg-red-50',
    label: 'Negative',
    description: 'Negative balance'
  },
  zero: {
    icon: AlertCircle,
    baseClass: 'text-gray-700 bg-gray-50 hover:bg-gray-50',
    label: 'No Credits',
    description: 'No credits available'
  },
  pending: {
    icon: Clock,
    baseClass: 'text-yellow-700 bg-yellow-50 hover:bg-yellow-50',
    label: 'Pending',
    description: 'Credits pending processing'
  }
} as const;

// Size configuration mapping
const SIZE_MAPPINGS = {
  sm: {
    text: 'text-xs',
    icon: 'h-3.5 w-3.5',
    spacing: 'gap-1 px-2 py-0.5'
  },
  md: {
    text: 'text-sm',
    icon: 'h-4 w-4',
    spacing: 'gap-1.5 px-2.5 py-1'
  },
  lg: {
    text: 'text-base',
    icon: 'h-5 w-5',
    spacing: 'gap-2 px-3 py-1.5'
  }
} as const;

/**
 * Credit Badge Component
 * 
 * Displays user credit information with appropriate visual indicators
 * Handles various credit states and pending transactions
 */
export const CreditBadge: React.FC<CreditBadgeProps> = ({
  amount,
  pending = 0,
  showIcon = true,
  showIndicator = true,
  size = 'md',
  variant = 'outline',
  className
}) => {
  // Determine credit state
  const getCreditState = (): keyof typeof CREDIT_STATES => {
    if (pending > 0) return 'pending';
    if (amount > 0) return 'positive';
    if (amount < 0) return 'negative';
    return 'zero';
  };

  const state = getCreditState();
  const config = CREDIT_STATES[state];
  const sizeConfig = SIZE_MAPPINGS[size];
  const Icon = showIcon ? config.icon : DollarSign;

  // Generate tooltip content
  const getTooltipContent = (): string => {
    const baseText = `${config.description}: ${formatCurrency(amount)}`;
    return pending > 0
      ? `${baseText}\nPending: ${formatCurrency(pending)}`
      : baseText;
  };

  return (
    <Badge
      variant={variant}
      className={cn(
        'font-medium whitespace-nowrap',
        sizeConfig.spacing,
        sizeConfig.text,
        config.baseClass,
        className
      )}
      title={getTooltipContent()}
    >
      <Icon className={sizeConfig.icon} aria-hidden="true" />
      <span>
        {formatCurrency(amount)}
        {showIndicator && pending > 0 && (
          <span className="ml-1 text-yellow-600">
            (+{formatCurrency(pending)})
          </span>
        )}
      </span>
    </Badge>
  );
};

/**
 * Credit Amount Display
 * Simplified version for basic amount display without badge styling
 */
export const CreditAmount: React.FC<Omit<CreditBadgeProps, 'variant'>> = (props) => (
  <CreditBadge {...props} variant="default" />
);

export default CreditBadge;