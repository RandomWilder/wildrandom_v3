import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

export interface DashboardMetrics {
  activeRaffles: number;
  totalUsers: number;
  totalRevenue: number;
  prizePoolValue: number;
  realtimeUsers: number;
  lastUpdated: string;
}

interface DashboardState {
  metrics: DashboardMetrics;
  isLoading: boolean;
  error: string | null;
  // Actions
  updateMetrics: (metrics: Partial<DashboardMetrics>) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

const initialMetrics: DashboardMetrics = {
  activeRaffles: 0,
  totalUsers: 0,
  totalRevenue: 0,
  prizePoolValue: 0,
  realtimeUsers: 0,
  lastUpdated: new Date().toISOString()
};

export const useDashboardStore = create<DashboardState>()(
  devtools(
    (set) => ({
      metrics: initialMetrics,
      isLoading: false,
      error: null,

      updateMetrics: (newMetrics) => set((state) => ({
        metrics: {
          ...state.metrics,
          ...newMetrics,
          lastUpdated: new Date().toISOString()
        }
      })),

      setLoading: (loading) => set({ isLoading: loading }),
      setError: (error) => set({ error })
    }),
    {
      name: 'dashboard-store',
      enabled: process.env.NODE_ENV === 'development'
    }
  )
);