import { atomWithStorage, createJSONStorage } from 'jotai/utils';
import type { AuthResponse, UserProfile } from '../features/auth/types';
import type { SiteCreditBalance } from '../api/types/payment';

interface SessionState {
  user: UserProfile | null;
  token: string | null;
  lastActivity: string | null;
  expiresAt: string | null;
  balance: SiteCreditBalance | null;  // Added for purchase flow
  balanceLastUpdated: string | null;  // Track balance freshness
}

const initialState: SessionState = {
  user: null,
  token: null,
  lastActivity: null,
  expiresAt: null,
  balance: null,
  balanceLastUpdated: null
};

// Custom storage adapter with expiry handling and balance management
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

      // Check balance staleness (consider balance stale after 5 minutes)
      if (storedValue.balanceLastUpdated) {
        const balanceAge = new Date().getTime() - new Date(storedValue.balanceLastUpdated).getTime();
        if (balanceAge > 5 * 60 * 1000) {  // 5 minutes
          return {
            ...storedValue,
            balance: null,
            balanceLastUpdated: null
          };
        }
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
  balance: null,   // Will be fetched separately
  balanceLastUpdated: null
});

// Balance-specific update helper
export const updateSessionBalance = (
  currentState: SessionState,
  balance: SiteCreditBalance
): SessionState => ({
  ...currentState,
  balance,
  balanceLastUpdated: new Date().toISOString()
});

// Enhanced type guard for session state
export const isActiveSession = (session: SessionState): boolean => {
  if (!session.token || !session.user) return false;
  
  if (session.expiresAt && new Date(session.expiresAt) <= new Date()) {
    return false;
  }

  // Check for recent activity (inactive after 30 minutes)
  if (session.lastActivity) {
    const activityAge = new Date().getTime() - new Date(session.lastActivity).getTime();
    return activityAge <= 30 * 60 * 1000;  // 30 minutes
  }

  return false;
};

// Balance validation helper
export const isBalanceStale = (session: SessionState): boolean => {
  if (!session.balanceLastUpdated) return true;
  
  const balanceAge = new Date().getTime() - new Date(session.balanceLastUpdated).getTime();
  return balanceAge > 5 * 60 * 1000;  // 5 minutes staleness threshold
};