// src/api/poolsApi.ts
import { api } from '@/lib/api-client';
import type { 
  PrizePool, 
  TemplateAllocation, 
  AllocationResponse,
  CreatePoolPayload
} from '@/types/pools';
import { AxiosError } from 'axios';

interface PoolsResponse {
  pools: PrizePool[];
}

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

interface InstancesResponse {
  instances: PrizeInstance[];
  summary: {
    available: number;
    claimed: number;
    discovered: number;
    expired: number;
    voided: number;
  };
  total_instances: number;
  pool_id: number;
  page: number;
  pages: number;
}

/**
 * API Route Configuration
 * Mirrors Flask blueprint structure
 */
const ROUTES = {
  admin: {
    base: '/api/admin/prizes/pools',
    pool: (id: number) => `/api/admin/prizes/pools/${id}`,
    allocate: (id: number) => `/api/admin/prizes/pools/${id}/allocate`,
    lock: (id: number) => `/api/admin/prizes/pools/${id}/lock`,
    instances: (id: number) => `/api/admin/prizes/pools/${id}/instances`
  },
  public: {
    base: '/api/prizes/pools',
    pool: (id: number) => `/api/prizes/pools/${id}`
  }
} as const;

/**
 * Prize Pool API Service
 * Implements comprehensive pool management functionality
 */
export const poolsApi = {
  /**
   * Administrative Operations
   */
  async listPools(): Promise<PrizePool[]> {
    try {
      const response = await api.get<PoolsResponse>(ROUTES.admin.base);
      return response.pools;
    } catch (error) {
      const axiosError = error as AxiosError;
      if (axiosError.response?.status === 405) {
        throw new Error('Operation not allowed. Please check your permissions.');
      }
      throw new Error(axiosError.message || 'Failed to fetch pools');
    }
  },

  async getPool(id: number): Promise<PrizePool> {
    try {
      const response = await api.get<PrizePool>(ROUTES.admin.pool(id));
      return response;
    } catch (error) {
      const axiosError = error as AxiosError;
      if (axiosError.response?.status === 404) {
        throw new Error('Pool not found');
      }
      throw new Error(axiosError.message || 'Failed to fetch pool');
    }
  },

  async createPool(data: CreatePoolPayload): Promise<PrizePool> {
    try {
      const response = await api.post<PrizePool>(ROUTES.admin.base, data);
      return response;
    } catch (error) {
      const axiosError = error as AxiosError;
      if (axiosError.response?.status === 409) {
        throw new Error(`Pool with name '${data.name}' already exists`);
      }
      throw new Error(axiosError.message || 'Failed to create pool');
    }
  },

  async lockPool(poolId: number): Promise<PrizePool> {
    try {
      const response = await api.put<PrizePool>(ROUTES.admin.lock(poolId));
      return response;
    } catch (error) {
      const axiosError = error as AxiosError;
      if (axiosError.response?.status === 400) {
        throw new Error('Pool cannot be locked. Please check requirements.');
      }
      throw new Error(axiosError.message || 'Failed to lock pool');
    }
  },

  async allocateTemplate(poolId: number, allocation: TemplateAllocation): Promise<AllocationResponse> {
    try {
      const response = await api.post<AllocationResponse>(
        ROUTES.admin.allocate(poolId),
        allocation
      );
      return response;
    } catch (error) {
      const axiosError = error as AxiosError;
      if (axiosError.response?.status === 400) {
        throw new Error('Invalid allocation parameters. Please check requirements.');
      }
      throw new Error(axiosError.message || 'Failed to allocate template');
    }
  },

  /**
   * Prize Instance Operations
   */
  async getPoolInstances(poolId: number): Promise<InstancesResponse> {
    try {
      const response = await api.get<InstancesResponse>(ROUTES.admin.instances(poolId));
      return response;
    } catch (error) {
      const axiosError = error as AxiosError;
      if (axiosError.response?.status === 404) {
        throw new Error('Pool not found');
      }
      if (axiosError.response?.status === 400) {
        throw new Error('Pool must be locked to view instances');
      }
      throw new Error(axiosError.message || 'Failed to fetch pool instances');
    }
  },

  /**
   * Public Operations
   */
  async listPublicPools(): Promise<PrizePool[]> {
    try {
      const response = await api.get<PoolsResponse>(ROUTES.public.base);
      return response.pools;
    } catch (error) {
      throw new Error((error as Error).message || 'Failed to fetch public pools');
    }
  }
};