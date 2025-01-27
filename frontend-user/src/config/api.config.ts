// src/config/api.config.ts
/**
 * API Configuration for the WildRandom gaming platform
 * Centralizes all endpoint definitions and configuration options
 */

export const API_CONFIG = {
  BASE_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api',
  TIMEOUT: 10000,
  ENDPOINTS: {
    AUTH: {
      LOGIN: '/users/login',
      REGISTER: '/users/register',
      GOOGLE_LOGIN: '/auth/google/login',
      GOOGLE_CALLBACK: '/auth/google/callback',
      VERIFY_EMAIL: '/users/verify/request',
      CONFIRM_EMAIL: (token: string) => `/users/verify/confirm/${token}`,
      PASSWORD_RESET_REQUEST: '/users/password/reset-request',
      PASSWORD_RESET: '/users/password/reset',
      PASSWORD_CHANGE: '/users/password/change'
    },
    USER: {
      PROFILE: '/users/me',
      UPDATE_PROFILE: '/users/profile',
      LOYALTY_STATUS: '/users/loyalty/status'
    },
    RAFFLE: {
      LIST: '/raffles',
      DETAILS: (id: number) => `/raffles/${id}`,
      RESERVE: (id: number) => `/raffles/${id}/reserve`,
      MY_TICKETS: (id: number) => `/raffles/${id}/tickets`
    }
  },
  HEADERS: {
    DEFAULT: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    withAuth: (token: string) => ({
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': `Bearer ${token}`
    })
  },
  REQUEST_CONFIG: {
    credentials: 'include' as const,
    mode: 'cors' as const
  }
} as const;

// Frontend route definitions
export const AUTH_ROUTES = {
  LOGIN: '/auth/login',
  REGISTER: '/auth/register',
  VERIFY_EMAIL: '/auth/verify-email',
  RESET_PASSWORD: '/auth/reset-password',
  SUCCESS: '/auth/success',
  DASHBOARD: '/dashboard'
} as const;

// Token configuration
export const TOKEN_CONFIG = {
  STORAGE_KEY: 'auth_token',
  USER_STORAGE_KEY: 'user_data',
  REFRESH_THRESHOLD: 5 * 60 * 1000 // 5 minutes in milliseconds
} as const;

// Helper function for generating full API URLs
export const getApiUrl = (endpoint: string): string => {
  return `${API_CONFIG.BASE_URL}${endpoint}`;
};