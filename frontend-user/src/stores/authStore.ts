// src/stores/authStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authApi } from '@/lib/api-client';
import type { User, LoginCredentials, RegistrationCredentials } from '@/types/auth';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | undefined;
  
  login: (credentials: LoginCredentials) => Promise<void>;
  signup: (credentials: RegistrationCredentials) => Promise<void>;
  logout: () => void;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: undefined,

      login: async (credentials) => {
        set({ isLoading: true, error: undefined });
        try {
          const response = await authApi.login(credentials);
          authApi.setAuthToken(response.token);
          set({
            user: response.user,
            token: response.token,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error) {
          const errorMessage = error instanceof Error 
            ? error.message 
            : 'Authentication failed. Please check your credentials.';
          
          set({
            error: errorMessage,
            isLoading: false,
          });
          throw error;
        }
      },

      signup: async (credentials) => {
        set({ isLoading: true, error: undefined });
        try {
          const response = await authApi.register(credentials);
          authApi.setAuthToken(response.token);
          set({
            user: response.user,
            token: response.token,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error) {
          const errorMessage = error instanceof Error 
            ? error.message 
            : 'Registration failed. Please try again.';
          
          set({
            error: errorMessage,
            isLoading: false,
          });
          throw error;
        }
      },

      logout: () => {
        authApi.clearAuthToken();
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          error: undefined,
        });
      },

      clearError: () => set({ error: undefined }),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        token: state.token,
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);