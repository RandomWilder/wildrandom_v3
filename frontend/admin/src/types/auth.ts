/**
 * Authentication Domain Types
 * 
 * Core type definitions for the admin authentication system.
 * These types align with the backend API contract while providing
 * type safety throughout the frontend application.
 */

// User Balance Information
export interface AdminUserBalance {
    available: number;
    pending: number;
    last_updated: string;
  }
  
  // Core User Model
  export interface AdminUser {
    id: number;
    username: string;
    email: string;
    first_name: string | null;
    last_name: string | null;
    is_active: boolean;
    is_admin: boolean;
    is_verified: boolean;
    auth_provider: 'local';
    last_login: string;
    created_at: string;
    phone_number: string | null;
    balance: AdminUserBalance;
  }
  
  // API Response Types
  export interface LoginResponse {
    token: string;
    user: AdminUser;
  }
  
  // Application State Types
  export interface AuthState {
    user: AdminUser | null;
    token: string | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    error: string | null;
  }
  
  // Auth Store Actions (for type completion)
  export interface AuthActions {
    login: (username: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
  }
  
  // Combined Store Type
  export type AuthStore = AuthState & AuthActions;