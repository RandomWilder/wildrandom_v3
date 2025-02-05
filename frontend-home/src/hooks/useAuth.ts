import { useCallback } from 'react';
import { useAtom } from 'jotai';
import { authStateAtom, clearAuthStateAtom, TokenData } from '../stores/auth';
import { authAPI } from '../api/client';
import type { LoginFormData, RegistrationFormData } from '../features/auth/schemas';
import type { RegistrationRequest, UserProfile } from '../features/auth/types';

/**
 * Transforms registration form data to API request format
 */
const transformFormToRequest = (formData: RegistrationFormData): RegistrationRequest => ({
  username: formData.username,
  email: formData.email,
  password: formData.password,
  first_name: formData.first_name,
  last_name: formData.last_name,
  phone_number: formData.phone_number || undefined
});

/**
 * Authentication hook providing complete auth state management
 * and user operations
 */
export const useAuth = () => {
  const [authState, setAuthState] = useAtom(authStateAtom);
  const [, clearAuth] = useAtom(clearAuthStateAtom);

  const login = useCallback(async (data: LoginFormData): Promise<UserProfile> => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true, error: null }));
      const response = await authAPI.login(data);
      const { token, user } = response.data;
      
      const tokenExpiry = new Date();
      tokenExpiry.setHours(tokenExpiry.getHours() + 24);
      const tokenData: TokenData = {
        token,
        expiry: tokenExpiry.toISOString()
      };

      // Store token in localStorage with standard format
      localStorage.setItem('auth_token', JSON.stringify(tokenData));

      setAuthState({
        user,
        isAuthenticated: true,
        isLoading: false,
        error: null,
        token,
        tokenExpiry: tokenExpiry.toISOString(),
        refreshInProgress: false
      });

      return user;
    } catch (error) {
      const errorMessage = authAPI.handleError(error);
      setAuthState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
        tokenExpiry: null,
        refreshInProgress: false
      }));
      throw new Error(errorMessage);
    }
  }, [setAuthState]);

  const register = useCallback(async (formData: RegistrationFormData): Promise<UserProfile> => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true, error: null }));
      const requestData = transformFormToRequest(formData);
      const response = await authAPI.register(requestData);
      const { token, user } = response.data;

      const tokenExpiry = new Date();
      tokenExpiry.setHours(tokenExpiry.getHours() + 24);
      const tokenData: TokenData = {
        token,
        expiry: tokenExpiry.toISOString()
      };

      // Store token in localStorage with standard format
      localStorage.setItem('auth_token', JSON.stringify(tokenData));

      setAuthState({
        user,
        isAuthenticated: true,
        isLoading: false,
        error: null,
        token,
        tokenExpiry: tokenExpiry.toISOString(),
        refreshInProgress: false
      });

      return user;
    } catch (error) {
      const errorMessage = authAPI.handleError(error);
      setAuthState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
        tokenExpiry: null,
        refreshInProgress: false
      }));
      throw new Error(errorMessage);
    }
  }, [setAuthState]);

  const logout = useCallback(async () => {
    localStorage.removeItem('auth_token');
    clearAuth();
  }, [clearAuth]);

  const refreshProfile = useCallback(async () => {
    if (!authState.isAuthenticated) return;

    try {
      const response = await authAPI.getProfile();
      setAuthState(prev => ({
        ...prev,
        user: response.data
      }));
    } catch (error) {
      console.error('Failed to refresh profile:', error);
    }
  }, [authState.isAuthenticated, setAuthState]);

  return {
    ...authState,
    login,
    register,
    logout,
    refreshProfile
  };
};

export default useAuth;