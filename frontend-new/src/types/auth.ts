/**
 * Core authentication types for the application
 */

// Base user interface shared between regular and admin users
export interface BaseUser {
    id: number;
    username: string;
    email: string;
    first_name: string | null;
    last_name: string | null;
    phone_number: string | null;
    auth_provider: 'local';
    is_verified: boolean;
    is_active: boolean;
    is_admin: boolean;
    created_at: string;
    last_login: string;
    site_credits: number;
  }
  
  // Admin-specific user interface
  export interface AdminUser extends BaseUser {
    is_admin: true;
  }
  
  // Login request payload
  export interface LoginCredentials {
    username: string;
    password: string;
  }
  
  // Login response structure
  export interface LoginResponse {
    token: string;
    user: AdminUser;
  }
  
  // Auth store state interface
  export interface AuthState {
    user: AdminUser | null;
    token: string | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    error: string | null;
  }
  
  // API Error response
  export interface ApiError {
    message: string;
    code?: string;
    details?: Record<string, string[]>;
  }