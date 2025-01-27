// src/types/auth.types.ts

export interface UserBalance {
  available: number;
  pending: number;
  last_updated: string;
}

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

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface RegisterCredentials {
  username: string;
  email: string;
  password: string;
  first_name?: string;
  last_name?: string;
  phone_number?: string;
}


export interface AuthResponse {
  success: boolean;
  token: string;
  user: User;
  message?: string;
  error?: string;
}

export interface AuthServiceResponse {
  success: boolean;
  redirect: string;
  user?: User;
  error?: string;
}

export interface ApiErrorResponse {
  error: string;
  details?: Record<string, string[]>;
  code?: string;
}

export type AuthErrorResponse = {
  error: string;
  details?: Record<string, string[]>;
  code?: string;
}