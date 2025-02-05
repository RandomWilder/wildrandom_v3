import { atom } from 'jotai';
import { atomWithStorage } from 'jotai/utils';
import type { UserProfile } from '../features/auth/types';

/**
 * Standardized token structure matching backend requirements
 */
export interface TokenData {
  token: string | null;
  expiry: string | null;
}

/**
 * Enhanced auth state with strict typing
 */
export interface AuthState {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  token: string | null;
  tokenExpiry: string | null;
  refreshInProgress: boolean;
}

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
  token: null,
  tokenExpiry: null,
  refreshInProgress: false
};

/**
 * Primary authentication state atom
 * Manages the complete auth lifecycle
 */
export const authStateAtom = atom<AuthState>(initialState);

/**
 * Persistent token storage with automatic validation
 */
export const tokenAtom = atomWithStorage<TokenData>(
  'auth_token',
  { token: null, expiry: null },
  {
    getItem: (key: string, initialValue: TokenData): TokenData => {
      try {
        const storedValue = localStorage.getItem(key);
        if (!storedValue) return initialValue;

        const parsed = JSON.parse(storedValue) as TokenData;
        
        // Validate token presence and expiry
        if (!parsed.token || !parsed.expiry) {
          return initialValue;
        }

        // Check token expiration
        if (new Date(parsed.expiry) <= new Date()) {
          localStorage.removeItem(key);
          return initialValue;
        }

        return parsed;
      } catch {
        localStorage.removeItem(key);
        return initialValue;
      }
    },
    setItem: (key: string, value: TokenData): void => {
      if (value.token && value.expiry) {
        localStorage.setItem(key, JSON.stringify(value));
      } else {
        localStorage.removeItem(key);
      }
    },
    removeItem: (key: string): void => {
      localStorage.removeItem(key);
    }
  }
);

/**
 * Computed atom for user profile access
 */
export const userProfileAtom = atom<UserProfile | null>(
  (get) => get(authStateAtom).user
);

/**
 * Computed atom for authentication status with expiry validation
 */
export const isAuthenticatedAtom = atom<boolean>(
  (get) => {
    const state = get(authStateAtom);
    if (!state.isAuthenticated || !state.token || !state.tokenExpiry) {
      return false;
    }
    return new Date(state.tokenExpiry) > new Date();
  }
);

/**
 * Action atom for profile updates with type safety
 */
export const updateUserProfileAtom = atom(
  null,
  (get, set, update: Partial<UserProfile>) => {
    const currentState = get(authStateAtom);
    if (!currentState.user) return;

    set(authStateAtom, {
      ...currentState,
      user: {
        ...currentState.user,
        ...update
      }
    });
  }
);

/**
 * Action atom for complete auth state clearance
 * Ensures synchronized cleanup of all auth-related state
 */
export const clearAuthStateAtom = atom(
  null,
  (_, set) => {
    set(authStateAtom, initialState);
    set(tokenAtom, { token: null, expiry: null });
    localStorage.removeItem('auth_token');
    sessionStorage.removeItem('auth_token');
  }
);