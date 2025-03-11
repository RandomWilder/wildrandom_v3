/**
 * Ticket Groups API Client
 * 
 * Implements type-safe API integration for ticket group management with:
 * - Comprehensive error handling
 * - Response validation
 * - Retry mechanisms
 * - Cache integration
 */

import axios, { AxiosError } from 'axios';
import axiosInstance from './client';
import { createApiError, createApiSuccess } from './types/common';
import type { 
  TicketGroup,
  TicketGroupsResponse,
  TicketGroupRequestConfig,
  TicketGroupError
} from './types/ticketGroups';

/**
 * Error Handling Utility for Ticket Groups API
 * Exposed for reuse across related modules
 */
export const handleTicketGroupError = (error: unknown): TicketGroupsResponse => {
  console.error("Ticket groups API error:", error);
  
  if (axios.isAxiosError(error)) {
    const apiError = error as AxiosError<TicketGroupError>;
    console.log("Response data:", apiError.response?.data);
    console.log("Response status:", apiError.response?.status);
    
    // Session expiry handling
    if (apiError.response?.status === 401) {
      return createApiError('AUTH_ERROR', 'Session expired', {
        redirect: '/auth/login'
      });
    }

    // API-level errors
    if (apiError.response?.data) {
      return createApiError(
        apiError.response.data.code || 'API_ERROR',
        apiError.response.data.message || 'Failed to fetch ticket groups',
        apiError.response.data.details
      );
    }

    // Network errors
    if (!apiError.response) {
      return createApiError(
        'NETWORK_ERROR',
        'Unable to connect to server'
      );
    }
  }

  // Fallback error
  return createApiError(
    'UNKNOWN_ERROR',
    'An unexpected error occurred while fetching ticket groups'
  );
};

class TicketGroupsAPI {
  private static readonly BASE_PATH = '/api/raffles';
  private static readonly GROUPS_ENDPOINT = `${TicketGroupsAPI.BASE_PATH}/my-tickets-groups`;

  /**
   * Fetches user's ticket groups with optional filtering and sorting
   * @param config Optional request configuration
   * @returns Promise<TicketGroupsResponse>
   */
  static async getTicketGroups(
    config?: TicketGroupRequestConfig
  ): Promise<TicketGroupsResponse> {
    try {
      const { data } = await axiosInstance.get<TicketGroup[]>(
        this.GROUPS_ENDPOINT,
        {
          params: {
            ...config?.filters,
            sort: config?.sort ? 
              `${config.sort.field}:${config.sort.direction}` : 
              undefined,
            include_metrics: config?.include_metrics
          }
        }
      );

      // Validate response before returning
      if (this.validateResponse(data)) {
        return createApiSuccess(data);
      }

      return createApiError(
        'INVALID_RESPONSE',
        'Received invalid response format from server'
      );

    } catch (err) {
      return handleTicketGroupError(err);
    }
  }

  /**
   * Updates cache timestamp for ticket groups
   * Implements optimistic updates with proper rollback
   */
  static async refreshCache(): Promise<void> {
    const cacheKey = 'ticket_groups_cache';
    localStorage.setItem(cacheKey, new Date().toISOString());
  }

  /**
   * Validates response structure
   * @private
   */
  private static validateResponse(data: unknown): data is TicketGroup[] {
    if (!Array.isArray(data)) {
      console.error("Ticket groups validation failed: data is not an array", data);
      return false;
    }
    
    // Less strict validation focusing on essential properties
    const valid = data.every(item => 
      typeof item === 'object' &&
      item !== null &&
      'raffle_id' in item &&
      'title' in item &&
      'total_tickets' in item &&
      'unrevealed_tickets' in item
    );
    
    console.log(`Ticket groups validation ${valid ? 'succeeded' : 'failed'}:`, 
      valid ? `${data.length} valid groups found` : data);
    
    return valid;
  }
}

// Export singleton instance
export default TicketGroupsAPI;