import React from 'react';
import {
  LogIn,
  LogOut,
  User,
  Key,
  ToggleLeft,
  Mail,
  Shield,
  Trash2,
  type LucideIcon
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ActivityType } from '@/types/users';

interface ActivityConfig {
  icon: LucideIcon;
  label: string;
  baseClass: string;
}

interface ActivityIconProps {
  type: ActivityType;
  size?: 'sm' | 'md' | 'lg';
  showBackground?: boolean;
  className?: string;
}

// Size configuration mapping
const SIZE_MAPPINGS = {
  sm: {
    icon: 'h-4 w-4',
    container: 'p-1.5'
  },
  md: {
    icon: 'h-5 w-5',
    container: 'p-2'
  },
  lg: {
    icon: 'h-6 w-6',
    container: 'p-2.5'
  }
} as const;

// Activity type configuration mapping
const ACTIVITY_CONFIG: Record<ActivityType, ActivityConfig> = {
  login: {
    icon: LogIn,
    label: 'Login',
    baseClass: 'text-green-600 bg-green-50'
  },
  logout: {
    icon: LogOut,
    label: 'Logout',
    baseClass: 'text-blue-600 bg-blue-50'
  },
  profile_update: {
    icon: User,
    label: 'Profile Update',
    baseClass: 'text-indigo-600 bg-indigo-50'
  },
  password_change: {
    icon: Key,
    label: 'Password Change',
    baseClass: 'text-amber-600 bg-amber-50'
  },
  status_change: {
    icon: ToggleLeft,
    label: 'Status Change',
    baseClass: 'text-purple-600 bg-purple-50'
  },
  email_verification: {
    icon: Mail,
    label: 'Email Verification',
    baseClass: 'text-cyan-600 bg-cyan-50'
  },
  admin_login: {
    icon: Shield,
    label: 'Admin Login',
    baseClass: 'text-red-600 bg-red-50'
  },
  account_deletion: {
    icon: Trash2,
    label: 'Account Deletion',
    baseClass: 'text-gray-600 bg-gray-50'
  }
};

/**
 * Activity Icon Component
 * 
 * Displays consistent icons for user activities with optional background styling
 * Maps directly to backend activity types for visual representation
 */
export const ActivityIcon: React.FC<ActivityIconProps> = ({
  type,
  size = 'md',
  showBackground = true,
  className
}) => {
  const config = ACTIVITY_CONFIG[type];
  const sizeConfig = SIZE_MAPPINGS[size];
  const Icon = config.icon;

  if (!showBackground) {
    return (
      <Icon 
        className={cn(
          sizeConfig.icon,
          config.baseClass.split(' ')[0], // Only use the text color class
          className
        )}
        aria-label={config.label}
      />
    );
  }

  return (
    <div
      className={cn(
        'rounded-full flex items-center justify-center',
        config.baseClass,
        sizeConfig.container,
        className
      )}
      title={config.label}
    >
      <Icon 
        className={sizeConfig.icon}
        aria-hidden="true"
      />
    </div>
  );
};

export default ActivityIcon;