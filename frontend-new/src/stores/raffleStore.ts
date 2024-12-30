// src/stores/raffleStore.ts
import { create } from 'zustand';
import { rafflesApi } from '@/api/rafflesApi';
import type {
  Raffle,
  RaffleCreatePayload,
  RaffleUpdatePayload,
  StatusUpdatePayload,
  StateUpdatePayload,
  RaffleStats,
  TicketFilter,
  Ticket,
  TicketResponse,
  DrawResult,
  PublicStatsResponse
} from '@/types/raffles';

/**
 * RaffleStore State and Actions Interface
 * Provides comprehensive type safety for raffle management operations
 */

interface RaffleState {
  // State
  raffles: Raffle[];
  currentRaffle: Raffle | null;
  raffleStats: PublicStatsResponse | null;
  tickets: Ticket[];
  totalTickets: number;
  ticketFilters: TicketFilter;
  drawResults: DrawResult[];
  winners: DrawResult[];
  userWins: DrawResult[];
  
  // Loading States
  isLoading: boolean;
  isLoadingTickets: boolean;
  isExecutingDraw: boolean;
  
  // Error States
  error: string | null;
  ticketError: string | null;
  drawError: string | null;
  
  // Raffle Actions
  loadRaffles: () => Promise<void>;
  loadPublicRaffles: () => Promise<void>;
  loadRaffle: (id: number) => Promise<void>;
  createRaffle: (payload: RaffleCreatePayload) => Promise<void>;
  updateRaffle: (id: number, payload: RaffleUpdatePayload) => Promise<void>;
  updateRaffleStatus: (id: number, payload: StatusUpdatePayload) => Promise<void>;
  updateRaffleState: (id: number, payload: StateUpdatePayload) => Promise<void>;
  
  // Ticket Actions
  loadTickets: (raffleId: number) => Promise<void>;
  updateTicketFilters: (filters: TicketFilter) => void;
  
  // Draw Actions
  executeDraw: (raffleId: number) => Promise<void>;
  loadDrawResults: (raffleId: number) => Promise<void>;
  loadWinners: (raffleId: number) => Promise<void>;
  loadUserWins: () => Promise<void>;
  
  // Stats Actions
  loadStats: (raffleId: number) => Promise<void>;
  
  // Utility Actions
  clearError: () => void;
}

/**
 * Raffle Store Implementation
 * Centralized state management for raffle operations
 */

export const useRaffleStore = create<RaffleState>((set, get) => ({
  // Initial State
  raffles: [],
  currentRaffle: null,
  raffleStats: null,
  tickets: [],
  totalTickets: 0,
  ticketFilters: {},
  drawResults: [],
  winners: [],
  userWins: [],
  isLoading: false,
  isLoadingTickets: false,
  isExecutingDraw: false,
  error: null,
  ticketError: null,
  drawError: null,

  // Collection Actions
  loadRaffles: async () => {
    try {
      set({ isLoading: true, error: null });
      const raffles = await rafflesApi.getRaffles();
      set({ raffles, isLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to load raffles',
        isLoading: false
      });
    }
  },

  updateRaffleStatus: async (id: number, payload: StatusUpdatePayload) => {
    try {
      set({ isLoading: true, error: null });
      const raffle = await rafflesApi.updateStatus(id, payload);
      set(state => ({
        raffles: state.raffles.map(r => r.id === id ? raffle : r),
        currentRaffle: state.currentRaffle?.id === id ? raffle : state.currentRaffle,
        isLoading: false
      }));
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to update status',
        isLoading: false
      });
      throw error;
    }
  },


  updateRaffleState: async (id: number, payload: StateUpdatePayload) => {
    try {
      set({ isLoading: true, error: null });
      const raffle = await rafflesApi.updateState(id, payload);
      set(state => ({
        raffles: state.raffles.map(r => r.id === id ? raffle : r),
        currentRaffle: state.currentRaffle?.id === id ? raffle : state.currentRaffle,
        isLoading: false
      }));
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to update state',
        isLoading: false
      });
      throw error;
    }
  },

  loadPublicRaffles: async () => {
    try {
      set({ isLoading: true, error: null });
      const response = await rafflesApi.getPublicRaffles();
      set({ 
        raffles: response,
        isLoading: false 
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to load public raffles',
        isLoading: false
      });
    }
  },

  // Single Raffle Actions
  loadRaffle: async (id: number) => {
    try {
      set({ isLoading: true, error: null });
      const raffle = await rafflesApi.getRaffle(id);
      set({ currentRaffle: raffle, isLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to load raffle',
        isLoading: false
      });
    }
  },


  loadStats: async (raffleId: number) => {
    try {
      set({ isLoading: true, error: null });
      const response = await rafflesApi.getRaffleStats(raffleId);
      
      // Type guard to ensure response has required properties
      const isValidResponse = (resp: any): resp is PublicStatsResponse => {
        return (
          resp &&
          typeof resp.total_tickets === 'number' &&
          typeof resp.available_tickets === 'number' &&
          typeof resp.sold_tickets === 'number' &&
          typeof resp.revealed_tickets === 'number' &&
          typeof resp.eligible_tickets === 'number' &&
          typeof resp.instant_wins_discovered === 'number' &&
          typeof resp.unique_participants === 'number'
        );
      };

      if (!isValidResponse(response)) {
        throw new Error('Invalid stats response format');
      }

      // Calculate eligible_tickets if not provided by API
      const stats: PublicStatsResponse = {
        ...response,
        eligible_tickets: response.eligible_tickets ?? 
          (response.sold_tickets - response.revealed_tickets)
      };

      set({ 
        raffleStats: stats,
        isLoading: false 
      });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to load raffle stats',
        isLoading: false 
      });
    }
  },

  // Ticket Actions
  loadTickets: async (raffleId: number) => {
    try {
      set({ isLoadingTickets: true, ticketError: null });
      const response = await rafflesApi.getRaffleTickets(raffleId, get().ticketFilters);
      set({ 
        tickets: response.tickets,
        totalTickets: response.total,
        isLoadingTickets: false
      });
    } catch (error) {
      set({ 
        ticketError: error instanceof Error ? error.message : 'Failed to load tickets',
        isLoadingTickets: false
      });
    }
  },

  updateTicketFilters: (filters: TicketFilter) => {
    set({ ticketFilters: filters });
  },

  createRaffle: async (payload: RaffleCreatePayload) => {
    try {
      set({ isLoading: true, error: null });
      const raffle = await rafflesApi.createRaffle(payload);
      set(state => ({ 
        raffles: [...state.raffles, raffle],
        currentRaffle: raffle,
        isLoading: false 
      }));
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to create raffle',
        isLoading: false
      });
      throw error;
    }
  },

  updateRaffle: async (id: number, payload: RaffleUpdatePayload) => {
    try {
      set({ isLoading: true, error: null });
      const raffle = await rafflesApi.updateRaffle(id, payload);
      set(state => ({
        raffles: state.raffles.map(r => r.id === id ? raffle : r),
        currentRaffle: state.currentRaffle?.id === id ? raffle : state.currentRaffle,
        isLoading: false
      }));
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to update raffle',
        isLoading: false
      });
      throw error;
    }
  },

  // Draw Actions
  executeDraw: async (raffleId: number) => {
    try {
      set({ isExecutingDraw: true, drawError: null });
      const response = await rafflesApi.executeDraw(raffleId);
      set({ 
        drawResults: response.draws,
        isExecutingDraw: false 
      });
      // Refresh winners after draw
      await get().loadWinners(raffleId);
    } catch (error) {
      set({
        drawError: error instanceof Error ? error.message : 'Failed to execute draw',
        isExecutingDraw: false
      });
      throw error;
    }
  },

  loadDrawResults: async (raffleId: number) => {
    try {
      const response = await rafflesApi.getDrawResults(raffleId);
      set({ drawResults: response.draws });
    } catch (error) {
      set({ drawError: error instanceof Error ? error.message : 'Failed to load draw results' });
    }
  },

  loadWinners: async (raffleId: number) => {
    try {
      const response = await rafflesApi.getRaffleWinners(raffleId);
      set({ winners: response });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to load winners' });
    }
  },

  loadUserWins: async () => {
    try {
      const response = await rafflesApi.getUserWins();
      set({ userWins: response });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to load user wins' });
    }
  },

  // Utility Actions
  clearError: () => set({ error: null, drawError: null, ticketError: null })
}));