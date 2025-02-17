// src/api/reservationApi.ts

import axios, { AxiosError } from 'axios';
import axiosInstance from './client';
import { createApiError, createApiSuccess } from './types/common';
import type { ApiResponse } from './types/common';
import type { 
  ReservationRequest, 
  ReservationResponse, 
  TicketReservation,
  ReservationError
} from './types/reservation';

/**
 * Reservation API Service
 * Provides type-safe interfaces to backend reservation services
 * Implements proper error handling and response validation
 */
export class ReservationApi {
  private static readonly BASE_PATH = '/api/raffles';

  /**
   * Maps backend validation errors to user-friendly messages
   * @private
   * @param error - Error response from backend
   * @returns Formatted error message
   */
  private static mapValidationError(error: ReservationError): string {
    if (error.details?.available_quantity !== undefined) {
      return `Only ${error.details.available_quantity} tickets available`;
    }
    if (error.details?.max_per_user !== undefined) {
      return `Maximum ${error.details.max_per_user} tickets per user allowed`;
    }
    return error.error;
  }

  /**
   * Create a new ticket reservation
   * 
   * @param raffleId - Target raffle identifier
   * @param data - Reservation request data
   * @returns Promise<ApiResponse<ReservationResponse>>
   * 
   * @throws Never - Errors are transformed into ApiResponse
   */
  static async createReservation(
    raffleId: number,
    data: ReservationRequest
  ): Promise<ApiResponse<ReservationResponse>> {
    try {
      const { data: responseData } = await axiosInstance.post<ReservationResponse>(
        `${this.BASE_PATH}/${raffleId}/reserve`,
        data
      );

      return createApiSuccess(responseData);
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const error = err as AxiosError<ReservationError>;
        
        if (error.response?.status === 400) {
          return createApiError(
            'VALIDATION_ERROR',
            this.mapValidationError(error.response.data)
          );
        }

        if (error.response?.status === 404) {
          return createApiError(
            'NOT_FOUND',
            'Raffle not found'
          );
        }

        return createApiError(
          'API_ERROR',
          error.response?.data?.error || 'Failed to create reservation'
        );
      }

      return createApiError(
        'UNKNOWN_ERROR',
        'An unexpected error occurred'
      );
    }
  }

  /**
   * Get reservation status
   * 
   * @param reservationId - Reservation identifier
   * @returns Promise<ApiResponse<TicketReservation>>
   */
  static async getReservation(
    reservationId: number
  ): Promise<ApiResponse<TicketReservation>> {
    try {
      const { data } = await axiosInstance.get<TicketReservation>(
        `${this.BASE_PATH}/reservations/${reservationId}`
      );

      return createApiSuccess(data);
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const error = err as AxiosError<ReservationError>;
        
        if (error.response?.status === 404) {
          return createApiError(
            'NOT_FOUND',
            'Reservation not found'
          );
        }

        return createApiError(
          'API_ERROR',
          error.response?.data?.error || 'Failed to fetch reservation'
        );
      }

      return createApiError(
        'UNKNOWN_ERROR',
        'An unexpected error occurred'
      );
    }
  }

  /**
   * Cancel an existing reservation
   * 
   * @param reservationId - Reservation identifier
   * @returns Promise<ApiResponse<void>>
   */
  static async cancelReservation(
    reservationId: number
  ): Promise<ApiResponse<void>> {
    try {
      await axiosInstance.post(
        `${this.BASE_PATH}/reservations/${reservationId}/cancel`
      );

      return createApiSuccess(undefined);
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const error = err as AxiosError<ReservationError>;

        if (error.response?.status === 404) {
          return createApiError(
            'NOT_FOUND',
            'Reservation not found'
          );
        }

        return createApiError(
          'API_ERROR',
          error.response?.data?.error || 'Failed to cancel reservation'
        );
      }

      return createApiError(
        'UNKNOWN_ERROR',
        'An unexpected error occurred'
      );
    }
  }
}

export default ReservationApi;