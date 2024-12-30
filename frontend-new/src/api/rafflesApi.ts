// src/api/rafflesApi.ts
import { api } from '@/lib/api-client';
import type { 
  Raffle,
  RaffleCreatePayload,
  RaffleUpdatePayload,
  StatusUpdatePayload,
  StateUpdatePayload,
  DrawResult,
  PrizePoolSummary,
  RaffleStats,
  Ticket,
  TicketResponse,
  TicketFilter,
  PublicStatsResponse
} from '@/types/raffles';

export const rafflesApi = {
  BASE_URL: '/api/admin/raffles',
  PUBLIC_URL: '/api/raffles',

  // Public Routes
  async getPublicRaffles(): Promise<Raffle[]> {
    try {
      const response = await api.get<{ raffles: Raffle[] }>(this.PUBLIC_URL);
      return response.raffles || [];
    } catch (error) {
      throw this.handleError(error);
    }
  },

  // Admin Routes
  async getRaffles(): Promise<Raffle[]> {
    try {
      const response = await api.get<{ raffles: Raffle[] }>(this.BASE_URL);
      return response.raffles || [];
    } catch (error) {
      throw this.handleError(error);
    }
  },

  async getRaffle(id: number): Promise<Raffle> {
    try {
      return await api.get<Raffle>(`${this.BASE_URL}/${id}`);
    } catch (error) {
      throw this.handleError(error);
    }
  },

  async createRaffle(payload: RaffleCreatePayload): Promise<Raffle> {
    try {
      return await api.post<Raffle>(this.BASE_URL, payload);
    } catch (error) {
      throw this.handleError(error);
    }
  },

  async updateRaffle(id: number, payload: RaffleUpdatePayload): Promise<Raffle> {
    try {
      return await api.put<Raffle>(`${this.BASE_URL}/${id}`, payload);
    } catch (error) {
      throw this.handleError(error);
    }
  },

  async updateStatus(id: number, payload: StatusUpdatePayload): Promise<Raffle> {
    try {
      return await api.put<Raffle>(`${this.BASE_URL}/${id}/status`, payload);
    } catch (error) {
      throw this.handleError(error);
    }
  },

  async updateState(id: number, payload: StateUpdatePayload): Promise<Raffle> {
    try {
      return await api.put<Raffle>(`${this.BASE_URL}/${id}/state`, payload);
    } catch (error) {
      throw this.handleError(error);
    }
  },

  // Stats
  async getRaffleStats(id: number): Promise<PublicStatsResponse> {
    try {
      return await api.get<PublicStatsResponse>(`${this.BASE_URL}/${id}/stats`);
    } catch (error) {
      throw this.handleError(error);
    }
  },

  // Tickets
  async getRaffleTickets(raffleId: number, filters?: TicketFilter): Promise<TicketResponse> {
    try {
      const params = new URLSearchParams();
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined) {
            params.append(key, String(value));
          }
        });
      }
      const queryString = params.toString() ? `?${params.toString()}` : '';
      return await api.get<TicketResponse>(`${this.BASE_URL}/${raffleId}/tickets${queryString}`);
    } catch (error) {
      throw this.handleError(error);
    }
  },

  // Draws
  async executeDraw(raffleId: number): Promise<{ draws: DrawResult[] }> {
    try {
      return await api.post<{ draws: DrawResult[] }>(`${this.BASE_URL}/${raffleId}/execute-draw`);
    } catch (error) {
      throw this.handleError(error);
    }
  },

  async getDrawResults(raffleId: number): Promise<{ draws: DrawResult[] }> {
    try {
      return await api.get<{ draws: DrawResult[] }>(`${this.BASE_URL}/${raffleId}/draws`);
    } catch (error) {
      throw this.handleError(error);
    }
  },

  async getRaffleWinners(raffleId: number): Promise<DrawResult[]> {
    try {
      const response = await api.get<{ winners: DrawResult[] }>(`${this.PUBLIC_URL}/${raffleId}/winners`);
      return response.winners;
    } catch (error) {
      throw this.handleError(error);
    }
  },

  async getUserWins(): Promise<DrawResult[]> {
    try {
      const response = await api.get<{ wins: DrawResult[] }>(`${this.PUBLIC_URL}/my-wins`);
      return response.wins;
    } catch (error) {
      throw this.handleError(error);
    }
  },

  handleError(error: unknown): Error {
    if (error instanceof Error) return error;
    return new Error('An unexpected error occurred');
  }
};