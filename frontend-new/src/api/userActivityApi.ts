import { api } from '@/lib/api-client';
import { AxiosError } from 'axios';
import type {
  UserActivity,
  ActivityFilter,
  ActivityResponse,
  ActivityMetrics,
  CreateActivityPayload,
  ActivityType
} from '@/types/users';

/**
 * API Route Configuration
 * Mirrors Flask blueprint structure
 */
const ROUTES = {
  admin: {
    base: '/api/admin/users/activities',
    activity: (id: number) => `/api/admin/users/activities/${id}`,
    userActivities: (userId: number) => `/api/admin/users/${userId}/activities`,
    metrics: '/api/admin/users/activities/metrics',
    export: (userId: number, format: string) => 
      `/api/admin/users/${userId}/activities/export?format=${format}`
  }
} as const;

/**
 * Error Handler Function
 */
const handleApiError = (error: unknown): Error => {
  if (error instanceof AxiosError) {
    // Handle structured API errors
    if (error.response?.data?.message) {
      return new Error(error.response.data.message);
    }

    // Handle HTTP status codes
    switch (error.response?.status) {
      case 400:
        return new Error('Invalid activity data provided.');
      case 401:
        return new Error('Authentication required for activity tracking.');
      case 403:
        return new Error('Insufficient permissions for activity management.');
      case 404:
        return new Error('Activity record not found.');
      case 429:
        return new Error('Too many activity requests. Please try again later.');
      default:
        return new Error('Failed to process activity request.');
    }
  }

  return error instanceof Error ? error : new Error('An unknown error occurred');
};

/**
 * Activity Tracking API Service
 * Implements comprehensive activity monitoring functionality
 */
export const userActivityApi = {
  /**
   * List Activities
   */
  async listActivities(filters?: ActivityFilter): Promise<ActivityResponse> {
    try {
      const queryParams = new URLSearchParams();
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined) {
            queryParams.append(key, String(value));
          }
        });
      }
      
      return await api.get<ActivityResponse>(
        `${ROUTES.admin.base}?${queryParams.toString()}`
      );
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * Get User Activities
   */
  async getUserActivities(userId: number, filters?: ActivityFilter): Promise<ActivityResponse> {
    try {
      const queryParams = new URLSearchParams();
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined) {
            queryParams.append(key, String(value));
          }
        });
      }
      
      return await api.get<ActivityResponse>(
        `${ROUTES.admin.userActivities(userId)}?${queryParams.toString()}`
      );
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * Get Activity Metrics
   */
  async getActivityMetrics(timeframe?: string): Promise<ActivityMetrics> {
    try {
      const queryParams = timeframe ? `?timeframe=${timeframe}` : '';
      return await api.get<ActivityMetrics>(
        `${ROUTES.admin.metrics}${queryParams}`
      );
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * Get Activity Details
   */
  async getActivity(id: number): Promise<UserActivity> {
    try {
      return await api.get<UserActivity>(ROUTES.admin.activity(id));
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * Create Activity Record
   */
  async createActivity(data: CreateActivityPayload): Promise<UserActivity> {
    try {
      return await api.post<UserActivity>(ROUTES.admin.base, data);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * Activity Type Aggregation
   */
  async getActivityTypeStats(
    startDate?: string,
    endDate?: string
  ): Promise<Record<ActivityType, number>> {
    try {
      const queryParams = new URLSearchParams();
      if (startDate) queryParams.append('start_date', startDate);
      if (endDate) queryParams.append('end_date', endDate);
      
      return await api.get<Record<ActivityType, number>>(
        `${ROUTES.admin.base}/stats?${queryParams.toString()}`
      );
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * User Activity Export
   */
  async exportUserActivities(userId: number, format: 'csv' | 'json' = 'csv'): Promise<string> {
    try {
      return await api.get<string>(ROUTES.admin.export(userId, format));
    } catch (error) {
      throw handleApiError(error);
    }
  }
};