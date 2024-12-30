/**
 * User Activity Types
 * Simplified frontend representation of backend activity tracking
 */

export type ActivityType = 
  | 'login'
  | 'logout'
  | 'profile_update'
  | 'password_change'
  | 'status_change'
  | 'email_verification'
  | 'admin_login'
  | 'account_deletion';

export type ActivityStatus = 'success' | 'failed' | 'blocked';

/**
 * Core Activity Interface
 */
export interface UserActivity {
  id: number;
  user_id: number;
  activity_type: ActivityType;
  status: ActivityStatus;
  // Simplified metadata for common tracking needs
  ip_address?: string;  // Optional for privacy
  user_agent?: string;  // Optional for privacy
  details?: Record<string, any>;
  created_at: string;
}

/**
 * Activity Filters
 */
export interface ActivityFilter {
  user_id?: number;
  activity_type?: ActivityType;
  status?: ActivityStatus;
  start_date?: string;
  end_date?: string;
}

/**
 * Activity Response Types
 */
export interface ActivityResponse {
  activities: UserActivity[];
  total: number;
}

/**
 * Activity Metrics
 */
export interface ActivityMetrics {
  total_activities: number;
  activities_by_type: Record<ActivityType, number>;
  activities_by_status: Record<ActivityStatus, number>;
  recent_activities: UserActivity[];
}

/**
 * Activity Creation Payload
 */
export interface CreateActivityPayload {
  user_id: number;
  activity_type: ActivityType;
  status: ActivityStatus;
  details?: Record<string, any>;
}

/**
 * Activity Display Metadata
 */
export const ACTIVITY_TYPE_META: Record<ActivityType, {
  label: string;
  description: string;
  icon: string;
}> = {
  login: {
    label: 'Login',
    description: 'User login attempt',
    icon: 'log-in'
  },
  logout: {
    label: 'Logout',
    description: 'User logout',
    icon: 'log-out'
  },
  profile_update: {
    label: 'Profile Update',
    description: 'User profile information updated',
    icon: 'user'
  },
  password_change: {
    label: 'Password Change',
    description: 'User password changed',
    icon: 'key'
  },
  status_change: {
    label: 'Status Change',
    description: 'User account status changed',
    icon: 'toggle-left'
  },
  email_verification: {
    label: 'Email Verification',
    description: 'Email verification attempt',
    icon: 'mail'
  },
  admin_login: {
    label: 'Admin Login',
    description: 'Administrator login',
    icon: 'shield'
  },
  account_deletion: {
    label: 'Account Deletion',
    description: 'Account deletion request',
    icon: 'trash'
  }
};

export const ACTIVITY_STATUS_META: Record<ActivityStatus, {
  label: string;
  color: string;
  bgColor: string;
}> = {
  success: {
    label: 'Success',
    color: 'text-green-700',
    bgColor: 'bg-green-50'
  },
  failed: {
    label: 'Failed',
    color: 'text-red-700',
    bgColor: 'bg-red-50'
  },
  blocked: {
    label: 'Blocked',
    color: 'text-yellow-700',
    bgColor: 'bg-yellow-50'
  }
};

export const ACTIVITY_STYLES: Record<ActivityType, { 
    textColor: string;
    bgColor: string; 
  }> = {
    login: { textColor: 'text-green-600', bgColor: 'bg-green-50' },
    logout: { textColor: 'text-blue-600', bgColor: 'bg-blue-50' },
    profile_update: { textColor: 'text-indigo-600', bgColor: 'bg-indigo-50' },
    password_change: { textColor: 'text-amber-600', bgColor: 'bg-amber-50' },
    status_change: { textColor: 'text-purple-600', bgColor: 'bg-purple-50' },
    email_verification: { textColor: 'text-cyan-600', bgColor: 'bg-cyan-50' },
    admin_login: { textColor: 'text-red-600', bgColor: 'bg-red-50' },
    account_deletion: { textColor: 'text-gray-600', bgColor: 'bg-gray-50' }
  };