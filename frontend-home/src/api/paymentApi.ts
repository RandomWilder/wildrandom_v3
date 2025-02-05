/**
 * Payment Service API Integration Layer
 * 
 * Implements type-safe interfaces to the backend payment service endpoints.
 * Ensures proper error handling, response validation, and state transitions.
 * 
 * Backend Service Contract:
 * @see src/payment_service/routes/public_routes.py
 * @see src/payment_service/schemas/response_schema.py
 */

import { AxiosError } from 'axios';
import axiosInstance from './client';
import { createApiSuccess, createApiError } from './types/common';
import { PurchaseErrorCode } from '../api/types/payment';
import type { ApiResponse } from './types/common';
import type {
  SiteCreditBalance,
  PurchaseResponse,
  PurchaseRequest
} from '../api/types/payment';

class PaymentAPI {
  private static readonly BASE_PATH = '/api/payments';

  /**
   * Fetch user's current site credit balance
   * Implements stale-while-revalidate caching pattern
   * 
   * @throws Never - Errors are transformed into ApiResponse
   * @returns ApiResponse<SiteCreditBalance>
   * 
   * Backend Endpoint:
   * @see src/payment_service/routes/public_routes.py:get_balance
   */
  static async getBalance(): Promise<ApiResponse<SiteCreditBalance>> {
    try {
      const { data } = await axiosInstance.get<SiteCreditBalance>(
        `${this.BASE_PATH}/balance`
      );

      return createApiSuccess(data);
    } catch (err) {
      if (err instanceof AxiosError) {
        if (err.response?.data?.error) {
          return createApiError(
            PurchaseErrorCode.NETWORK_ERROR,
            err.response.data.error
          );
        }
        return createApiError(
          PurchaseErrorCode.NETWORK_ERROR,
          err.message
        );
      }
      return createApiError(
        PurchaseErrorCode.NETWORK_ERROR,
        'Failed to fetch balance'
      );
    }
  }

  /**
   * Process a purchase transaction for a reservation
   * Implements atomic transaction processing with rollback support
   * 
   * @param reservationId Valid reservation identifier
   * @throws Never - Errors are transformed into ApiResponse
   * @returns ApiResponse<PurchaseResponse>
   * 
   * Backend Endpoint:
   * @see src/payment_service/routes/public_routes.py:purchase_tickets
   */
  static async processPurchase(
    reservationId: number
  ): Promise<ApiResponse<PurchaseResponse>> {
    try {
      const request: PurchaseRequest = { reservation_id: reservationId };
      const { data } = await axiosInstance.post<PurchaseResponse>(
        `${this.BASE_PATH}/purchase`,
        request
      );

      return createApiSuccess(data);
    } catch (err) {
      if (err instanceof AxiosError) {
        if (err.response?.data?.error) {
          return createApiError(
            PurchaseErrorCode.TRANSACTION_FAILED,
            err.response.data.error
          );
        }
        if (err.response?.status === 400) {
          return createApiError(
            PurchaseErrorCode.INSUFFICIENT_BALANCE,
            'Insufficient balance for purchase'
          );
        }
        return createApiError(
          PurchaseErrorCode.NETWORK_ERROR,
          err.message
        );
      }
      return createApiError(
        PurchaseErrorCode.TRANSACTION_FAILED,
        'Failed to process purchase'
      );
    }
  }

  /**
   * Verify balance sufficiency for a transaction
   * Implements pre-flight validation pattern
   * 
   * @param amount Transaction amount to validate
   * @throws Never - Errors are transformed into ApiResponse
   * @returns ApiResponse<{ sufficient: boolean }>
   * 
   * Backend Endpoint:
   * @see src/payment_service/routes/public_routes.py:verify_balance
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
      if (err instanceof AxiosError && err.response?.data?.error) {
        return createApiError(
          PurchaseErrorCode.NETWORK_ERROR,
          err.response.data.error
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