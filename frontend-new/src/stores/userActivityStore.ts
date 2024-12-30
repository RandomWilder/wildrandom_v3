import { create } from 'zustand';
import { userActivityApi } from '@/api/userActivityApi';
import type {
  UserActivity,
  ActivityFilter,
  ActivityResponse,
  ActivityMetrics,
  ActivityType,
  CreateActivityPayload
} from '@/types/users';

interface ActivityState {
  // Collection State
  activities: UserActivity[];
  totalActivities: number;
  currentPage: number;
  itemsPerPage: number;
  
  // Metrics State
  metrics: ActivityMetrics | null;
  typeStats: Record<ActivityType, number> | null;
  
  // Filter State
  filters: ActivityFilter;
  
  // UI State
  isLoading: boolean;
  isExporting: boolean;
  error: string | null;
  
  // Collection Actions
  fetchActivities: (filters?: ActivityFilter) => Promise<void>;
  fetchUserActivities: (userId: number, filters?: ActivityFilter) => Promise<void>;
  createActivity: (data: CreateActivityPayload) => Promise<void>;
  
  // Metrics Actions
  fetchMetrics: (timeframe?: string) => Promise<void>;
  fetchTypeStats: (startDate?: string, endDate?: string) => Promise<void>;
  
  // Export Action
  exportActivities: (userId: number, format?: 'csv' | 'json') => Promise<string>;
  
  // Filter Actions
  setFilters: (filters: ActivityFilter) => void;
  clearFilters: () => void;
  
  // Utility Actions
  clearError: () => void;
  setPagination: (page: number, itemsPerPage: number) => void;
}

const DEFAULT_ITEMS_PER_PAGE = 50;

export const useActivityStore = create<ActivityState>((set, get) => ({
  // Initial State
  activities: [],
  totalActivities: 0,
  currentPage: 1,
  itemsPerPage: DEFAULT_ITEMS_PER_PAGE,
  metrics: null,
  typeStats: null,
  filters: {},
  isLoading: false,
  isExporting: false,
  error: null,

  // Collection Actions
  fetchActivities: async (filters?: ActivityFilter) => {
    try {
      set({ isLoading: true, error: null });
      const mergedFilters = { ...get().filters, ...filters };
      const { activities, total } = await userActivityApi.listActivities(mergedFilters);
      
      set({
        activities,
        totalActivities: total,
        filters: mergedFilters,
        isLoading: false
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch activities',
        isLoading: false
      });
    }
  },

  fetchUserActivities: async (userId: number, filters?: ActivityFilter) => {
    try {
      set({ isLoading: true, error: null });
      const mergedFilters = { ...get().filters, ...filters };
      const { activities, total } = await userActivityApi.getUserActivities(userId, mergedFilters);
      
      set({
        activities,
        totalActivities: total,
        filters: mergedFilters,
        isLoading: false
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch user activities',
        isLoading: false
      });
    }
  },

  createActivity: async (data: CreateActivityPayload) => {
    try {
      set({ isLoading: true, error: null });
      const activity = await userActivityApi.createActivity(data);
      
      // Optimistic update
      set(state => ({
        activities: [activity, ...state.activities],
        totalActivities: state.totalActivities + 1,
        isLoading: false
      }));
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to create activity',
        isLoading: false
      });
      throw error;
    }
  },

  // Metrics Actions
  fetchMetrics: async (timeframe?: string) => {
    try {
      set({ isLoading: true, error: null });
      const metrics = await userActivityApi.getActivityMetrics(timeframe);
      set({ metrics, isLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch metrics',
        isLoading: false
      });
    }
  },

  fetchTypeStats: async (startDate?: string, endDate?: string) => {
    try {
      set({ isLoading: true, error: null });
      const stats = await userActivityApi.getActivityTypeStats(startDate, endDate);
      set({ typeStats: stats, isLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch type statistics',
        isLoading: false
      });
    }
  },

  // Export Action
  exportActivities: async (userId: number, format: 'csv' | 'json' = 'csv') => {
    try {
      set({ isExporting: true, error: null });
      const result = await userActivityApi.exportUserActivities(userId, format);
      set({ isExporting: false });
      return result;
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to export activities',
        isExporting: false
      });
      throw error;
    }
  },

  // Filter Actions
  setFilters: (filters: ActivityFilter) => {
    set({ filters });
    get().fetchActivities(filters);
  },

  clearFilters: () => {
    set({ filters: {} });
    get().fetchActivities();
  },

  // Utility Actions
  clearError: () => {
    set({ error: null });
  },

  setPagination: (page: number, itemsPerPage: number) => {
    set({
      currentPage: page,
      itemsPerPage
    });
    get().fetchActivities();
  }
}));