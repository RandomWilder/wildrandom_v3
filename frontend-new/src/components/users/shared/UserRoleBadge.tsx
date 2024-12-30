import React from 'react';
import { Shield, Users, User, Star } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { UserRole, UserPermission } from '@/types/users';

interface RoleConfig {
  label: string;
  icon: typeof Shield;
  baseClass: string;
  description: string;
}

interface UserRoleBadgeProps {
  role: UserRole;
  permissions?: UserPermission[];
  showIcon?: boolean;
  showTooltip?: boolean;
  className?: string;
}

// Role configuration mapping
const ROLE_CONFIG: Record<UserRole, RoleConfig> = {
  admin: {
    label: 'Administrator',
    icon: Shield,
    baseClass: 'text-purple-700 bg-purple-50 hover:bg-purple-50',
    description: 'Full system access and management capabilities'
  },
  user: {
    label: 'User',
    icon: User,
    baseClass: 'text-blue-700 bg-blue-50 hover:bg-blue-50',
    description: 'Standard user access'
  }
};

/**
 * User Role Badge Component
 * 
 * Displays user role with consistent styling and optional permission details
 * Integrates with the admin interface permission system
 */
export const UserRoleBadge: React.FC<UserRoleBadgeProps> = ({
  role,
  permissions = [],
  showIcon = true,
  showTooltip = true,
  className
}) => {
  const config = ROLE_CONFIG[role];
  const Icon = config.icon;
  
  // Generate tooltip content based on role and permissions
  const getTooltipContent = (): string => {
    if (!showTooltip) return '';
    
    const permissionsList = permissions.length > 0
      ? `\nPermissions: ${permissions.map(p => p.name).join(', ')}`
      : '';
      
    return `${config.description}${permissionsList}`;
  };

  return (
    <Badge
      variant="outline"
      className={cn(
        'gap-1.5 font-medium whitespace-nowrap',
        config.baseClass,
        className
      )}
      title={getTooltipContent()}
    >
      {showIcon && <Icon className="h-3.5 w-3.5" aria-hidden="true" />}
      {config.label}
    </Badge>
  );
};

export default UserRoleBadge;