// frontend/admin/src/components/shared/MetricsCard.tsx

import { Card, CardContent } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MetricsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
    label: string;
  };
  className?: string;
}

export function MetricsCard({
  title,
  value,
  icon: Icon,
  trend,
  className
}: MetricsCardProps) {
  return (
    <Card className={cn('hover:shadow-md transition-shadow duration-200', className)}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">{title}</p>
            <p className="mt-2 text-3xl font-semibold text-gray-900">
              {value}
            </p>
            {trend && (
              <p className={cn(
                'mt-2 text-sm font-medium flex items-center',
                trend.isPositive ? 'text-green-600' : 'text-red-600'
              )}>
                <span className={cn(
                  'inline-block mr-1',
                  trend.isPositive ? 'rotate-0' : 'rotate-180'
                )}>
                  ↑
                </span>
                {trend.value}%
                <span className="text-gray-500 ml-1.5">
                  {trend.label}
                </span>
              </p>
            )}
          </div>
          <div className="p-3 bg-primary/10 rounded-full">
            <Icon className="w-6 h-6 text-primary" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}