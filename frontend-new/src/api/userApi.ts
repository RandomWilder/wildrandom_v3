// src/api/userApi.ts

import { api } from '@/lib/api-client';
import { AxiosError } from 'axios';
import type {
  BaseUser,
  CreateUserPayload,
  UpdateUserPayload,
  UpdateUserStatusPayload,
  UserListResponse,
  UserResponse,
  UserFilters,
  UserError,
  ValidationResult,
  EmailVerification,
  UserDetail
} from '@/types/users';

interface DetailedUserResponse {
  user: UserDetail;
  message?: string;
}

const ROUTES = {
  admin: {
    base: '/api/admin',
    users: '/api/admin/users',
    user: (id: number) => `/api/admin/users/${id}`,
    status: (id: number) => `/api/admin/users/${id}/status`,
    verify: (id: number) => `/api/admin/users/${id}/verify`,
    search: '/api/admin/users/search'
  }
} as const;

const handleApiError = (error: unknown): Error => {
  if (error instanceof AxiosError) {
    const apiError = error.response?.data as UserError;
    if (apiError?.message) {
      return new Error(apiError.message);
    }

    switch (error.response?.status) {
      case 400: return new Error('Invalid request. Please check your input.');
      case 401: return new Error('Authentication required.');
      case 403: return new Error('Permission denied.');
      case 404: return new Error('User not found.');
      case 405: return new Error('Method not allowed for this endpoint.');
      case 409: return new Error('Conflict with existing data.');
      case 500: return new Error('Internal server error.');
      default: return new Error('An unexpected error occurred.');
    }
  }
  return error instanceof Error ? error : new Error('Unknown error occurred');
};

export const userApi = {
  async listUsers(filters?: UserFilters): Promise<UserListResponse> {
    try {
      let url = ROUTES.admin.users;
      
      if (filters) {
        const params = new URLSearchParams();
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            params.append(key, String(value));
          }
        });
        const queryString = params.toString();
        if (queryString) {
          url += `?${queryString}`;
        }
      }
      
      const response = await api.get<UserListResponse>(url);
      return response;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  async getUser(id: number): Promise<UserDetail> {
    try {
      const response = await api.get<DetailedUserResponse>(ROUTES.admin.user(id));
      return response.user;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  async createUser(data: CreateUserPayload): Promise<BaseUser> {
    try {
      const response = await api.post<UserResponse>(ROUTES.admin.users, data);
      return response.user;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  async updateUser(id: number, data: UpdateUserPayload): Promise<BaseUser> {
    try {
      const response = await api.put<UserResponse>(ROUTES.admin.user(id), data);
      return response.user;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  async updateUserStatus(id: number, data: UpdateUserStatusPayload): Promise<BaseUser> {
    try {
      const response = await api.put<UserResponse>(ROUTES.admin.status(id), data);
      return response.user;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  async verifyUser(id: number): Promise<EmailVerification> {
    try {
      const response = await api.post<EmailVerification>(ROUTES.admin.verify(id));
      return response;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  async searchUsers(query: string): Promise<UserListResponse> {
    try {
      const url = `${ROUTES.admin.search}?q=${encodeURIComponent(query)}`;
      const response = await api.get<UserListResponse>(url);
      return response;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  async validateUsername(username: string): Promise<ValidationResult> {
    try {
      const response = await api.post<ValidationResult>(
        `${ROUTES.admin.users}/validate/username`,
        { username }
      );
      return response;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  async validateEmail(email: string): Promise<ValidationResult> {
    try {
      const response = await api.post<ValidationResult>(
        `${ROUTES.admin.users}/validate/email`,
        { email }
      );
      return response;
    } catch (error) {
      throw handleApiError(error);
    }
  }
};