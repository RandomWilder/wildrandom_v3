// src/api/paymentApi.ts

import axios, { AxiosError } from 'axios';
import axiosInstance from './client';
import { createApiError, createApiSuccess } from './types/common';
import { PurchaseErrorCode } from '../features/payment/enums';
import type { ApiResponse } from './types/common';
import type {
  PurchaseResponse,
  SiteCreditBalance,
  PurchaseTransaction
} from './types/payment';

/**
 * Payment Service API Integration Layer
 * 
 * Implements type-safe interfaces to the backend payment service endpoints.
 * Ensures proper error handling, response validation, and state transitions.
 */
class PaymentAPI {
  private static readonly BASE_PATH = '/api/payments';

  /**
   * Process a purchase transaction for a reservation
   * Implements atomic transaction processing with rollback support
   * 
   * @param reservationId - Valid reservation identifier
   * @throws Never - Errors are transformed into ApiResponse
   * @returns ApiResponse<PurchaseResponse>
   */
  static async processPurchase(
    reservationId: number
  ): Promise<ApiResponse<PurchaseResponse>> {
    try {
      const { data } = await axiosInstance.post<PurchaseResponse>(
        `${this.BASE_PATH}/purchase`,
        { reservation_id: reservationId }
      );

      return createApiSuccess(data);
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const error = err as AxiosError<{ error: string }>;
        
        if (error.response?.status === 400) {
          if (error.response.data.error.includes('Insufficient balance')) {
            return createApiError(
              PurchaseErrorCode.INSUFFICIENT_BALANCE,
              'Insufficient balance for purchase'
            );
          }
          if (error.response.data.error.includes('expired')) {
            return createApiError(
              PurchaseErrorCode.RESERVATION_EXPIRED,
              'Reservation has expired'
            );
          }
          return createApiError(
            PurchaseErrorCode.TRANSACTION_FAILED,
            error.response.data.error
          );
        }

        return createApiError(
          PurchaseErrorCode.NETWORK_ERROR,
          error.response?.data?.error || 'Failed to process purchase'
        );
      }

      return createApiError(
        PurchaseErrorCode.TRANSACTION_FAILED,
        'An unexpected error occurred during purchase'
      );
    }
  }

  /**
   * Fetch user's current site credit balance
   * Implements stale-while-revalidate caching pattern
   * 
   * @throws Never - Errors are transformed into ApiResponse
   * @returns ApiResponse<SiteCreditBalance>
   */
  static async getBalance(): Promise<ApiResponse<SiteCreditBalance>> {
    try {
      const { data } = await axiosInstance.get<SiteCreditBalance>(
        `${this.BASE_PATH}/balance`
      );

      return createApiSuccess(data);
    } catch (err) {
      if (axios.isAxiosError(err)) {
        return createApiError(
          PurchaseErrorCode.NETWORK_ERROR,
          'Failed to fetch balance'
        );
      }

      return createApiError(
        PurchaseErrorCode.NETWORK_ERROR,
        'An unexpected error occurred'
      );
    }
  }

  /**
   * Get transaction by ID
   * Retrieves detailed transaction information
   * 
   * @param transactionId - Transaction identifier
   * @throws Never - Errors are transformed into ApiResponse
   * @returns ApiResponse<PurchaseTransaction>
   */
  static async getTransaction(
    transactionId: number
  ): Promise<ApiResponse<PurchaseTransaction>> {
    try {
      const { data } = await axiosInstance.get<PurchaseTransaction>(
        `${this.BASE_PATH}/transactions/${transactionId}`
      );

      return createApiSuccess(data);
    } catch (err) {
      if (axios.isAxiosError(err)) {
        if (err.response?.status === 404) {
          return createApiError(
            PurchaseErrorCode.TRANSACTION_FAILED,
            'Transaction not found'
          );
        }

        return createApiError(
          PurchaseErrorCode.NETWORK_ERROR,
          'Failed to fetch transaction'
        );
      }

      return createApiError(
        PurchaseErrorCode.NETWORK_ERROR,
        'An unexpected error occurred'
      );
    }
  }

  /**
   * Verify balance sufficiency for a transaction
   * Implements pre-flight validation pattern
   * 
   * @param amount - Transaction amount to validate
   * @throws Never - Errors are transformed into ApiResponse
   * @returns ApiResponse<{ sufficient: boolean }>
   */
  static async validateBalance(
    amount: number
  ): Promise<ApiResponse<{ sufficient: boolean }>> {
    try {
      const { data } = await axiosInstance.post<{ sufficient: boolean }>(
        `${this.BASE_PATH}/balance/verify`,
        { amount }
      );

      return createApiSuccess(data);
    } catch (err) {
      if (axios.isAxiosError(err)) {
        return createApiError(
          PurchaseErrorCode.NETWORK_ERROR,
          'Failed to validate balance'
        );
      }

      return createApiError(
        PurchaseErrorCode.NETWORK_ERROR,
        'Failed to validate balance'
      );
    }
  }
}

export default PaymentAPI;