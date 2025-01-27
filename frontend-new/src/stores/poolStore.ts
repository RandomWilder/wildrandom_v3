// src/stores/poolStore.ts
import { create } from 'zustand';
import { poolsApi } from '@/api/poolsApi';
import type { 
  PrizePool, 
  TemplateAllocation, 
  AllocationResponse,
  CreatePoolPayload
} from '@/types/pools';

interface PrizeInstance {
  instance_id: string;
  template_id: number;
  type: 'instant_win' | 'draw_win';
  status: string;
  values: {
    retail: number;
    cash: number;
    credit: number;
  };
  created_at: string;
  discovery_info: any | null;
  claim_info: any | null;
}

interface InstancesSummary {
  available: number;
  claimed: number;
  discovered: number;
  expired: number;
  voided: number;
}

interface PoolState {
  // Collection State
  pools: PrizePool[];
  activePool: PrizePool | null;
  
  // Instances State
  instances: PrizeInstance[];
  instancesSummary: InstancesSummary | null;
  
  // UI State
  isLoading: boolean;
  isLoadingInstances: boolean;
  error: string | null;

  // Collection Actions
  fetchPools: () => Promise<void>;
  getPool: (id: number) => Promise<void>;
  createPool: (data: CreatePoolPayload) => Promise<void>;
  lockPool: (poolId: number) => Promise<void>;
  allocateTemplate: (poolId: number, allocation: TemplateAllocation) => Promise<AllocationResponse>;
  
  // Instance Actions
  fetchInstances: (poolId: number) => Promise<void>;
  
  // Utility Actions
  clearError: () => void;
}

export const usePoolStore = create<PoolState>((set, get) => ({
  // Initial State
  pools: [],
  activePool: null,
  instances: [],
  instancesSummary: null,
  isLoading: false,
  isLoadingInstances: false,
  error: null,

  fetchPools: async () => {
    set({ isLoading: true, error: null });
    try {
      const pools = await poolsApi.listPools();
      set({ pools, isLoading: false });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to fetch pools',
        isLoading: false 
      });
      throw error;
    }
  },

  getPool: async (id: number) => {
    set({ isLoading: true, error: null });
    try {
      const pool = await poolsApi.getPool(id);
      set({ activePool: pool, isLoading: false });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to fetch pool',
        isLoading: false 
      });
      throw error;
    }
  },

  createPool: async (data: CreatePoolPayload) => {
    set({ isLoading: true, error: null });
    try {
      const pool = await poolsApi.createPool(data);
      set(state => ({ 
        pools: [...state.pools, pool],
        isLoading: false 
      }));
    } catch (error) {
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'Failed to create pool';
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  lockPool: async (poolId: number) => {
    set({ isLoading: true, error: null });
    try {
      const updatedPool = await poolsApi.lockPool(poolId);
      set(state => ({
        pools: state.pools.map(pool => 
          pool.id === poolId ? updatedPool : pool
        ),
        activePool: state.activePool?.id === poolId ? updatedPool : state.activePool,
        isLoading: false
      }));
    } catch (error) {
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'Failed to lock pool';
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  allocateTemplate: async (poolId: number, allocation: TemplateAllocation) => {
    set({ isLoading: true, error: null });
    try {
      const response = await poolsApi.allocateTemplate(poolId, allocation);
      // Refresh pool data to get updated state
      const updatedPool = await poolsApi.getPool(poolId);
      
      set(state => ({
        pools: state.pools.map(pool => 
          pool.id === poolId ? updatedPool : pool
        ),
        activePool: updatedPool,
        isLoading: false
      }));

      return response;
    } catch (error) {
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'Failed to allocate template';
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  fetchInstances: async (poolId: number) => {
    set({ isLoadingInstances: true });
    try {
      const response = await poolsApi.getPoolInstances(poolId);
      set({ 
        instances: response.instances,
        instancesSummary: response.summary,
        isLoadingInstances: false 
      });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to fetch instances',
        isLoadingInstances: false 
      });
      throw error;
    }
  },

  clearError: () => set({ error: null })
}));