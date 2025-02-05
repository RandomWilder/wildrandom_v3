// File: /src/stores/session.ts

import { atomWithStorage, createJSONStorage } from 'jotai/utils';
import type { AuthResponse, UserProfile } from '../features/auth/types';

interface SessionState {
  user: UserProfile | null;
  token: string | null;
  lastActivity: string | null;
  expiresAt: string | null;
}

const initialState: SessionState = {
  user: null,
  token: null,
  lastActivity: null,
  expiresAt: null
};

// Custom storage adapter with expiry handling
const createSecureStorage = () => {
  const storage = createJSONStorage<SessionState>(() => sessionStorage);
  
  return {
    ...storage,
    getItem: (key: string, initialValue: SessionState) => {
      const storedValue = storage.getItem(key, initialValue);
      if (!storedValue) return initialState;

      // Check token expiry
      if (storedValue.expiresAt && new Date(storedValue.expiresAt) < new Date()) {
        storage.removeItem(key);
        return initialState;
      }

      return storedValue;
    },
    setItem: (key: string, value: SessionState) => {
      // Set expiry to 24 hours from now if not already set
      if (!value.expiresAt) {
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + 24);
        value.expiresAt = expiresAt.toISOString();
      }
      value.lastActivity = new Date().toISOString();
      storage.setItem(key, value);
    }
  };
};

// Create session atom with secure storage
export const sessionAtom = atomWithStorage<SessionState>(
  'wildrandom_session',
  initialState,
  createSecureStorage()
);

// Helper to update session with API response
export const updateSessionFromResponse = (response: AuthResponse): SessionState => ({
  user: response.user,
  token: response.token,
  lastActivity: new Date().toISOString(),
  expiresAt: null, // Will be set by storage adapter
});