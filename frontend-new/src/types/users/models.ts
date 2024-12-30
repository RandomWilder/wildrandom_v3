/**
 * Core User Domain Types
 * Maps directly to Python backend models in user_service
 */

/**
 * Base Models
 */
export interface BaseUser {
    id: number;
    username: string;
    email: string;
    first_name: string | null;
    last_name: string | null;
    site_credits: number;
    is_active: boolean;
    is_verified: boolean;
    is_admin: boolean;
    created_at: string;
    last_login: string | null;
    phone_number: string | null;
    auth_provider: AuthProvider;
    google_id?: string | null;
  }

  export interface DetailedUserResponse {
    user: {
      // Core User Information
      id: number;
      username: string;
      email: string;
      first_name: string | null;
      last_name: string | null;
      phone_number: string | null;
      auth_provider: 'local' | 'google';
      is_verified: boolean;
      is_active: boolean;
      is_admin: boolean;
      created_at: string;
      last_login: string | null;
      verification_status: 'verified' | 'pending';
  
      // Loyalty Information
      loyalty_level: string;
      loyalty_badges: string[];
      loyalty_total_entries: number;
      loyalty_total_spend: number;
      loyalty_streak_days: number;
      loyalty_last_activity: string | null;
      loyalty_level_updated_at: string | null;
  
      // Balance Information
      balance_available: number;
      balance_last_updated: string | null;
  
      // Activity History
      status_changes: Array<{
        timestamp: string;
        from: boolean;
        to: boolean;
        reason: string;
      }>;
      recent_activities: Array<{
        timestamp: string;
        type: string;
        status: string;
      }>;
    }
  }
  
  /**
   * User Status Management
   */
  export interface UserStatusChange {
  timestamp: string;
  previous_status: boolean;
  new_status: boolean;
  reason: string;
}

export interface RecentActivity {
  timestamp: string;
  type: string;
  status: string;
}
  
  /**
   * Password Management
   */
  export interface PasswordReset {
    id: number;
    user_id: number;
    token: string;
    expires_at: string;
    used: boolean;
    used_at: string | null;
    created_at: string;
  }
  
  /**
   * Authentication & Security Types
   */
  export type AuthProvider = 'local' | 'google';
  
  export interface LoginCredentials {
    username: string;
    password: string;
  }
  
  export interface PasswordChangeRequest {
    current_password: string;
    new_password: string;
  }
  
  export interface PasswordResetRequest {
    email: string;
  }
  
  export interface PasswordResetConfirmation {
    token: string;
    new_password: string;
  }
  
  /**
   * User Create/Update Payloads
   */
  export interface CreateUserPayload {
    username: string;
    email: string;
    password: string;
    first_name?: string;
    last_name?: string;
    phone_number?: string;
  }
  
  export interface UpdateUserPayload {
    email?: string;
    first_name?: string;
    last_name?: string;
    phone_number?: string;
    current_password?: string; // Required when updating email
  }
  
  export interface UpdateUserStatusPayload {
    is_active: boolean;
    reason: string;
  }
  
  /**
   * Email Verification Types
   */
  export interface EmailVerification {
    token: string | null;
    expires_at: string | null;
    is_verified: boolean;
  }
  
  /**
   * Response Types
   */
  export interface UserResponse {
    user: BaseUser;
    token?: string;
  }
  
  export interface UserListResponse {
    users: BaseUser[];
    total: number;
    page: number;
    per_page: number;
  }
  
  /**
   * Utility Types
   */
  export interface UserFilters {
    search?: string;
    status?: boolean;
    verified?: boolean;
    auth_provider?: AuthProvider;
    created_after?: string;
    created_before?: string;
    [key: string]: any; // Add index signature to allow string indexing
  }
  
  export interface UserGamingMetrics {
    total_tickets: number;
    revealed_tickets: number;
    total_raffles: number;
    total_wins: number;
  }  

  export interface UserDetail extends BaseUser {
    // Core User Information
    verification_status: 'verified' | 'pending';
  
    // Loyalty Information
    loyalty_level: string; 
    loyalty_badges: string[];
    loyalty_total_entries: number;
    loyalty_total_spend: number;
    loyalty_streak_days: number;
    loyalty_last_activity: string | null;
    loyalty_level_updated_at: string | null;
  
    // Balance Information
    balance_available: number;
    balance_last_updated: string | null;
  
    // Activity History
    status_changes: UserStatusChange[];
    recent_activities: RecentActivity[];

    // Gaming Metrics
    gaming_metrics: UserGamingMetrics;
  }
  
  export interface ValidationResult {
    isValid: boolean;
    errors: string[];
  }
  
  /**
   * User Role & Permission Types
   * (Simplified for initial implementation)
   */
  export type UserRole = 'admin' | 'user';
  
  export interface UserPermission {
    id: number;
    name: string;
    description: string;
  }
  
  /**
   * Error Types
   */
  export interface UserError {
    code: string;
    message: string;
    field?: string;
  }

  