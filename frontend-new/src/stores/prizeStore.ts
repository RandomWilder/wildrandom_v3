import { create } from 'zustand';
import { prizeApi } from '@/api/prizeApi';
import { poolsApi } from '@/api/poolsApi';
import type { 
  PrizeTemplate, 
  CreateTemplatePayload, 
  UpdateTemplatePayload 
} from '@/types/prizes/models';
import type { PrizePool } from '@/types/pools';

interface PrizeState {
  // Template State
  templates: PrizeTemplate[];
  activeTemplate: PrizeTemplate | null;
  
  // Pool State
  prizePools: PrizePool[];
  
  // UI State
  isLoading: boolean;
  error: string | null;
  
  // Template Actions
  fetchTemplates: () => Promise<void>;
  getTemplate: (id: number) => Promise<void>;
  createTemplate: (data: CreateTemplatePayload) => Promise<void>;
  updateTemplate: (id: number, data: UpdateTemplatePayload) => Promise<void>;
  
  // Pool Actions
  loadPrizePools: () => Promise<void>;
  
  // Utility Actions
  clearError: () => void;
}

export const usePrizeStore = create<PrizeState>((set, get) => ({
  // Initial State
  templates: [],
  activeTemplate: null,
  prizePools: [],
  isLoading: false,
  error: null,

  // Template Actions
  fetchTemplates: async () => {
    set({ isLoading: true, error: null });
    try {
      const templates = await prizeApi.listTemplates();
      set({ templates, isLoading: false });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to fetch templates',
        isLoading: false 
      });
    }
  },

  getTemplate: async (id: number) => {
    set({ isLoading: true, error: null });
    try {
      const template = await prizeApi.getTemplate(id);
      set({ activeTemplate: template, isLoading: false });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to fetch template',
        isLoading: false 
      });
    }
  },

  createTemplate: async (data: CreateTemplatePayload) => {
    set({ isLoading: true, error: null });
    try {
      const template = await prizeApi.createTemplate(data);
      set(state => ({ 
        templates: [...state.templates, template],
        isLoading: false 
      }));
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to create template',
        isLoading: false 
      });
      throw error;
    }
  },

  updateTemplate: async (id: number, data: UpdateTemplatePayload) => {
    set({ isLoading: true, error: null });
    try {
      const template = await prizeApi.updateTemplate(id, data);
      set(state => ({
        templates: state.templates.map(t => 
          t.id === template.id ? template : t
        ),
        activeTemplate: template,
        isLoading: false
      }));
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to update template',
        isLoading: false 
      });
      throw error;
    }
  },

  // Pool Actions
  loadPrizePools: async () => {
    set({ isLoading: true, error: null });
    try {
      const pools = await poolsApi.listPools();
      set({ prizePools: pools, isLoading: false });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to fetch prize pools',
        isLoading: false 
      });
    }
  },

  // Utility Actions
  clearError: () => set({ error: null })
}));