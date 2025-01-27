// src/services/raffle.service.ts
import { API_CONFIG } from '@/config/api.config';
import { enhancedFetch } from '@/lib/request-middleware';
import type { Raffle } from '@/types/raffle';
import { AuthService } from '@/lib/auth';

export class RaffleService {
  private static readonly BASE_URL = API_CONFIG.BASE_URL;

  /**
   * Fetches active raffles with enhanced error handling
   */
  static async getActiveRaffles(): Promise<Raffle[]> {
    try {
      const response = await enhancedFetch(
        `${this.BASE_URL}/raffles`,
        { method: 'GET' }
      );

      const data = await response.json();
      
      if (!Array.isArray(data.raffles)) {
        throw new Error('Invalid raffle data format');
      }

      return data.raffles;
    } catch (error) {
      console.error('Failed to fetch raffles:', error);
      throw error;
    }
  }

  /**
   * Fetches user's loyalty status with authentication
   */
  static async getLoyaltyStatus() {
    const user = AuthService.getUser();
    if (!user) return null;

    try {
      const response = await enhancedFetch(
        `${this.BASE_URL}/users/loyalty/status`,
        { method: 'GET' },
        { requiresAuth: true }
      );

      return response.json();
    } catch (error) {
      console.error('Failed to fetch loyalty status:', error);
      return null;
    }
  }

  /**
   * Fetches dashboard data with parallel requests
   */
  static async getDashboardData() {
    try {
      const [raffles, loyaltyStatus] = await Promise.all([
        this.getActiveRaffles(),
        this.getLoyaltyStatus()
      ]);

      return {
        raffles,
        loyaltyStatus
      };
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
      throw new Error('Failed to load game data');
    }
  }

  /**
   * Retries a failed request with exponential backoff
   */
  private static async retryWithBackoff<T>(
    operation: () => Promise<T>,
    maxAttempts: number = 3,
    baseDelay: number = 1000
  ): Promise<T> {
    let attempt = 0;
    let lastError: Error | null = null;

    while (attempt < maxAttempts) {
      try {
        return await operation();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        attempt++;
        
        if (attempt === maxAttempts) break;

        // Exponential backoff with jitter
        const delay = baseDelay * Math.pow(2, attempt) * (0.5 + Math.random() * 0.5);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    throw lastError || new Error('Operation failed after retries');
  }
}