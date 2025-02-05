import axios, { AxiosError } from 'axios';
import axiosInstance from './client';
import type { 
  ReservationRequest, 
  ReservationResponse, 
  TicketReservation,
  ReservationError
} from './types/reservation';

/**
 * Reservation API Service
 * Provides type-safe interfaces to backend reservation services
 */
export const reservationApi = {
  /**
   * Create a new ticket reservation
   * 
   * @param raffleId - Target raffle identifier
   * @param data - Reservation request data
   * @returns Promise<ReservationResponse | ReservationError>
   * 
   * @throws AxiosError for network or server errors
   */
  createReservation: async (
    raffleId: number,
    data: ReservationRequest
  ): Promise<ReservationResponse | ReservationError> => {
    try {
      const { data: responseData } = await axiosInstance.post<ReservationResponse>(
        `/api/raffles/${raffleId}/reserve`,
        data
      );
      return responseData;
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const error = err as AxiosError<ReservationError>;
        return {
          error: error.response?.data?.error || 'Failed to create reservation',
          details: error.response?.data?.details
        };
      }
      return { error: 'An unexpected error occurred' };
    }
  },

  /**
   * Get reservation status
   * 
   * @param reservationId - Reservation identifier
   * @returns Promise<TicketReservation | ReservationError>
   */
  getReservationStatus: async (
    reservationId: number
  ): Promise<TicketReservation | ReservationError> => {
    try {
      const { data } = await axiosInstance.get<TicketReservation>(
        `/api/raffles/reservations/${reservationId}`
      );
      return data;
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const error = err as AxiosError<ReservationError>;
        return {
          error: error.response?.data?.error || 'Failed to fetch reservation status'
        };
      }
      return { error: 'An unexpected error occurred' };
    }
  },

  /**
   * Cancel an existing reservation
   * 
   * @param reservationId - Reservation identifier
   * @returns Promise<void | ReservationError>
   */
  cancelReservation: async (
    reservationId: number
  ): Promise<void | ReservationError> => {
    try {
      await axiosInstance.post(`/api/raffles/reservations/${reservationId}/cancel`);
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const error = err as AxiosError<ReservationError>;
        return {
          error: error.response?.data?.error || 'Failed to cancel reservation'
        };
      }
      return { error: 'An unexpected error occurred' };
    }
  }
};

export default reservationApi;