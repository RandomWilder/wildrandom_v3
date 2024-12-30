import React from 'react';
import { Shield, ShieldAlert, ShieldCheck, ShieldX } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface UserStatusBadgeProps {
  isActive: boolean;
  isVerified: boolean;
  isAdmin?: boolean;
  showIcon?: boolean;
  className?: string;
}

/**
 * User Status Badge Component
 * 
 * Displays user status with consistent visual indicators:
 * - Active/Inactive state
 * - Verification status
 * - Administrative privileges
 */
export const UserStatusBadge: React.FC<UserStatusBadgeProps> = ({
  isActive,
  isVerified,
  isAdmin = false,
  showIcon = true,
  className
}) => {
  // Determine badge configuration based on status
  const getStatusConfig = () => {
    if (!isActive) {
      return {
        variant: 'destructive' as const,
        label: 'Inactive',
        icon: ShieldX,
        baseClass: 'text-red-700 bg-red-50 hover:bg-red-50'
      };
    }

    if (isAdmin) {
      return {
        variant: 'secondary' as const,
        label: 'Admin',
        icon: Shield,
        baseClass: 'text-purple-700 bg-purple-50 hover:bg-purple-50'
      };
    }

    if (!isVerified) {
      return {
        variant: 'outline' as const,
        label: 'Unverified',
        icon: ShieldAlert,
        baseClass: 'text-yellow-700 bg-yellow-50 hover:bg-yellow-50'
      };
    }

    return {
      variant: 'outline' as const,
      label: 'Active',
      icon: ShieldCheck,
      baseClass: 'text-green-700 bg-green-50 hover:bg-green-50'
    };
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  return (
    <Badge
      variant={config.variant}
      className={cn(
        'gap-1 font-medium',
        config.baseClass,
        className
      )}
    >
      {showIcon && <Icon className="h-3.5 w-3.5" />}
      {config.label}
    </Badge>
  );
};

export default UserStatusBadge;