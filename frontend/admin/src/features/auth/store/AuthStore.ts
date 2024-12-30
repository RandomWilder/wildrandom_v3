import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { api } from '@/shared/api/client';
import { AxiosError } from 'axios';

interface AdminUser {
  id: string;
  username: string;
  email: string;
  role: 'ADMIN' | 'SUPER_ADMIN';
  is_active: boolean;
}

// Properly structured API response type
interface ApiResponse<T> {
  data: T;
  message: string;
  status: 'success' | 'error';
}

interface LoginResponseData {
  token: string;
  user: AdminUser;
}

interface AuthState {
  user: AdminUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export const useAuthStore = create<
  AuthState & {
    login: (username: string, password: string) => Promise<void>;
    logout: () => void;
  }
>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      login: async (username: string, password: string) => {
        set({ isLoading: true, error: null });
        
        try {
          const response = await api.post<ApiResponse<LoginResponseData>>('/api/admin/login', {
            username,
            password
          });

          const { token, user } = response.data.data;

          if (!token || !user) {
            throw new Error('Invalid response structure');
          }

          set({
            user,
            token,
            isAuthenticated: true,
            isLoading: false,
            error: null
          });

          api.setAuthHeader(`Bearer ${token}`);

        } catch (error) {
          const errorMessage = error instanceof AxiosError 
            ? error.response?.data?.message || 'Authentication failed'
            : 'Authentication failed';

          set({
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false,
            error: errorMessage
          });
          
          throw error;
        }
      },

      logout: () => {
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          error: null
        });
        
        api.clearAuthHeader();
      }
    }),
    {
      name: 'admin-auth-store',
      partialize: (state) => ({
        token: state.token,
        user: state.user
      })
    }
  )
);