 
// API Request/Response Types
export interface RegistrationRequest {
    username: string;  // 3-64 chars, alphanumeric + _-
    email: string;    // Valid email format
    password: string; // Min 8 chars with complexity requirements
    first_name?: string;
    last_name?: string;
    phone_number?: string; // E.164 format
  }
  
  export interface LoginRequest {
    username: string;
    password: string;
  }
  
  // Shared Types
  export interface UserProfile {
    id: number;
    username: string;
    email: string;
    first_name?: string;
    last_name?: string;
    is_verified: boolean;
    phone_number?: string;  // Aligned with backend expectation
    balance: {
      available: number;
      pending: number;
      last_updated: string; // ISO8601
    };
  }
  
  export interface AuthResponse {
    user: UserProfile;
    token: string; // JWT token for subsequent requests
  }
  
  // Internal State Types
  export interface AuthState {
    user: UserProfile | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    error: string | null;
    token: string | null;
  }
  
  // Form Types
  export interface LoginFormData extends LoginRequest {
    rememberMe?: boolean;
  }