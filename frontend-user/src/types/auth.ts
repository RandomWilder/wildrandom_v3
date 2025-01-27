// src/types/auth.ts

/**
 * Core user balance information
 * Tracks user's available and pending currency in the gaming platform
 */
export interface UserBalance {
  available: number;
  pending: number;
  last_updated: string;
}

/**
 * Comprehensive user interface aligning with backend response
 * Includes all fields necessary for user state management
 */
export interface User {
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
  balance: UserBalance;
}

/**
 * Validation state tracking for registration form fields
 */
export interface FieldValidationState {
  valid: boolean;
  message: string | null;
  touched: boolean;
}

export type FieldValidation = {
  valid: boolean;
  message: string | null;
  touched: boolean;
};

export type FormValidationState = {
  username: FieldValidation;
  email: FieldValidation;
  password: FieldValidation;
  first_name: FieldValidation;
  last_name: FieldValidation;
  phone_number: FieldValidation;
};

/**
 * Registration credentials interface matching backend requirements
 */
export type RegistrationCredentials = {
  username: string;
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  phone_number: string;
};


/**
 * Response structure for successful registration
 */
export interface RegistrationResponse {
  user: User;
  message?: string;
}

/**
 * Google OAuth specific tokens
 */
export interface GoogleTokens {
  access_token: string;
  refresh_token: string;
  expires_in: number;
}

/**
 * Extended response for Google OAuth registration
 */
export interface GoogleAuthResponse extends RegistrationResponse {
  google_tokens: GoogleTokens;
}

/**
 * Registration progress tracking
 */
export type RegistrationStep = 
  | 'initial'
  | 'form_filling'
  | 'validation'
  | 'submission'
  | 'success'
  | 'verification_pending';

/**
 * Comprehensive registration state
 */
export interface RegistrationState {
  step: RegistrationStep;
  progress: number;
  errors: Record<string, string>;
  validationState: FormValidationState;
  isSubmitting: boolean;
}

/**
 * API error response structure
 */
export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, string[]>;
}

/**
 * Auth store state interface
 */
export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: ApiError | null;
  registrationState: RegistrationState;
}