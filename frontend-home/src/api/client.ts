import axios, { AxiosError, AxiosInstance } from 'axios';
import type { 
  AuthResponse, 
  LoginRequest, 
  RegistrationRequest, 
  UserProfile 
} from '../features/auth/types';
import type { TokenData } from '../stores/auth';

interface ApiErrorResponse {
  message?: string;
  error?: string;
  detail?: string;
  status?: number;
}

interface TokenRefreshResponse {
  token: string;
  expiry: string;
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const createAxiosInstance = (): AxiosInstance => {
  const instance = axios.create({
    baseURL: API_URL,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  instance.interceptors.request.use(
    async (config) => {
      const tokenStr = localStorage.getItem('auth_token');
      
      if (tokenStr) {
        try {
          const tokenData = JSON.parse(tokenStr) as TokenData;
          if (tokenData.token) {
            config.headers.Authorization = `Bearer ${tokenData.token}`;
          }
        } catch (error) {
          console.error('Token parsing error:', error);
          localStorage.removeItem('auth_token');
        }
      }
      
      return config;
    },
    (error) => Promise.reject(error)
  );

  instance.interceptors.response.use(
    (response) => response,
    async (error: AxiosError<ApiErrorResponse>) => {
      if (error.response?.status === 401) {
        localStorage.removeItem('auth_token');
        window.location.href = '/auth/login';
      }
      return Promise.reject(error);
    }
  );

  return instance;
};

const axiosInstance = createAxiosInstance();

export const authAPI = {
  register: async (data: RegistrationRequest) => {
    return axiosInstance.post<AuthResponse>('/api/users/register', data);
  },

  login: async (data: LoginRequest) => {
    const response = await axiosInstance.post<AuthResponse>('/api/users/login', data);
    
    if (response.data.token) {
      const tokenData: TokenData = {
        token: response.data.token,
        expiry: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      };
      localStorage.setItem('auth_token', JSON.stringify(tokenData));
    }
    
    return response;
  },

  getProfile: async () => {
    return axiosInstance.get<UserProfile>('/api/users/me');
  },

  refreshToken: async () => {
    const response = await axiosInstance.post<TokenRefreshResponse>('/api/auth/refresh');
    
    if (response.data.token) {
      const tokenData: TokenData = {
        token: response.data.token,
        expiry: response.data.expiry
      };
      localStorage.setItem('auth_token', JSON.stringify(tokenData));
    }
    
    return response;
  },

  validateToken: async () => {
    const response = await fetch('/api/auth/validate', {
      headers: {
        'Authorization': `Bearer ${sessionStorage.getItem('wildrandom_session')}`
      }
    });
    if (!response.ok) {
      throw new Error('Invalid token');
    }
    return response.json();
  },

  handleError: (error: unknown): string => {
    if (axios.isAxiosError(error)) {
      const apiError = error as AxiosError<ApiErrorResponse>;
      const errorData = apiError.response?.data;
      
      if (errorData?.message) return errorData.message;
      if (errorData?.error) return errorData.error;
      if (errorData?.detail) return errorData.detail;
      
      if (error.message === 'Network Error') {
        return 'Unable to connect to the server. Please check your connection.';
      }
    }
    return 'An unexpected error occurred';
  }
};

export default axiosInstance;