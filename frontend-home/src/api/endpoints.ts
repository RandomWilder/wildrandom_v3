// src/api/endpoints.ts

import axios, { AxiosError } from 'axios';
import axiosInstance from './client';
import type {
  RaffleListResponse,
  Raffle,
  TicketRevealRequest,
  TicketRevealResponse,
  ReservationRequest,
  ReservationResponse,
  RaffleStatsResponse,
  ApiResponse,
  ApiError
} from './types';

/**
 * Raffle API Service
 * Provides type-safe interfaces to backend raffle services
 */
export const raffleAPI = {
  /**
   * Fetch list of active raffles
   * @returns Promise<ApiResponse<RaffleListResponse>>
   */
  listRaffles: async (): Promise<ApiResponse<RaffleListResponse>> => {
    try {
      const { data } = await axiosInstance.get<RaffleListResponse>('/api/raffles/');
      return data;
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const error = err as AxiosError<ApiError>;
        return {
          error: error.response?.data?.error || 'Failed to fetch raffles'
        };
      }
      return { error: 'An unexpected error occurred' };
    }
  },

  /**
   * Get detailed raffle information
   * @param raffleId - The ID of the raffle to fetch
   * @returns Promise<ApiResponse<Raffle>>
   */
  getRaffle: async (raffleId: number): Promise<ApiResponse<Raffle>> => {
    try {
      const { data } = await axiosInstance.get<Raffle>(`/api/raffles/${raffleId}`);
      
      // Validate response structure
      if (!data || typeof data.id !== 'number') {
        return { error: 'Invalid response format from server' };
      }
      
      return data;
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const error = err as AxiosError<ApiError>;
        
        // Handle specific error cases
        if (error.response?.status === 404) {
          return { error: 'Raffle not found' };
        }

        // Handle network or server errors
        if (!error.response) {
          return { error: 'Network error - please check your connection' };
        }

        return { 
          error: error.response?.data?.error || `Failed to fetch raffle ${raffleId}`
        };
      }
      return { error: 'An unexpected error occurred' };
    }
  },

  /**
   * Reserve tickets for a raffle
   * @param raffleId - Target raffle ID
   * @param data - Reservation request data
   * @returns Promise<ApiResponse<ReservationResponse>>
   */
  reserveTickets: async (
    raffleId: number,
    data: ReservationRequest
  ): Promise<ApiResponse<ReservationResponse>> => {
    try {
      const { data: responseData } = await axiosInstance.post<ReservationResponse>(
        `/api/raffles/${raffleId}/reserve`,
        data
      );
      return responseData;
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const error = err as AxiosError<ApiError>;
        return {
          error: error.response?.data?.error || 'Failed to reserve tickets'
        };
      }
      return { error: 'An unexpected error occurred' };
    }
  },

  /**
   * Reveal purchased tickets
   * @param raffleId - Target raffle ID
   * @param data - Ticket reveal request data
   * @returns Promise<ApiResponse<TicketRevealResponse>>
   */
  revealTickets: async (
    raffleId: number,
    data: TicketRevealRequest
  ): Promise<ApiResponse<TicketRevealResponse>> => {
    try {
      const { data: responseData } = await axiosInstance.post<TicketRevealResponse>(
        `/api/raffles/${raffleId}/tickets/reveal`,
        data
      );
      return responseData;
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const error = err as AxiosError<ApiError>;
        return {
          error: error.response?.data?.error || 'Failed to reveal tickets'
        };
      }
      return { error: 'An unexpected error occurred' };
    }
  },

  /**
   * Get raffle statistics
   * @param raffleId - Target raffle ID
   * @returns Promise<ApiResponse<RaffleStatsResponse>>
   */
  getRaffleStats: async (raffleId: number): Promise<ApiResponse<RaffleStatsResponse>> => {
    try {
      const { data } = await axiosInstance.get<RaffleStatsResponse>(
        `/api/raffles/${raffleId}/stats`
      );
      return data;
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const error = err as AxiosError<ApiError>;
        return {
          error: error.response?.data?.error || 'Failed to fetch raffle statistics'
        };
      }
      return { error: 'An unexpected error occurred' };
    }
  }
};

export default raffleAPI;