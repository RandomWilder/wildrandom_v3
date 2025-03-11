// src/stores/userTransactionStore.ts
import { create } from 'zustand';
import { 
  userTransactionsApi, 
  type Transaction, 
  type TransactionFilter 
} from '@/api/userTransactionsApi';

interface TransactionState {
  // Collection State
  transactions: Transaction[];
  totalTransactions: number;
  currentPage: number;
  totalPages: number;
  itemsPerPage: number;
  
  // Filter State
  filters: TransactionFilter;
  
  // UI State
  isLoading: boolean;
  error: string | null;
  
  // Collection Actions
  fetchUserTransactions: (userId: number, filters?: TransactionFilter) => Promise<void>;
  
  // Filter Actions
  setFilters: (filters: TransactionFilter) => void;
  clearFilters: () => void;
  
  // Utility Actions
  clearError: () => void;
}

const DEFAULT_ITEMS_PER_PAGE = 20;

export const useTransactionStore = create<TransactionState>((set, get) => ({
  // Initial State
  transactions: [],
  totalTransactions: 0,
  currentPage: 1,
  totalPages: 1,
  itemsPerPage: DEFAULT_ITEMS_PER_PAGE,
  filters: {},
  isLoading: false,
  error: null,

  // Actions
  fetchUserTransactions: async (userId: number, filters?: TransactionFilter) => {
    try {
      set({ isLoading: true, error: null });
      const mergedFilters = { ...get().filters, ...filters };
      const response = await userTransactionsApi.getUserTransactions(userId, mergedFilters);
      
      set({
        transactions: response.transactions,
        totalTransactions: response.total,
        currentPage: response.page,
        totalPages: response.pages,
        itemsPerPage: response.per_page,
        filters: mergedFilters,
        isLoading: false
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch user transactions',
        isLoading: false
      });
    }
  },

  setFilters: (filters: TransactionFilter) => {
    set({ filters });
  },

  clearFilters: () => {
    set({ filters: {} });
  },

  clearError: () => set({ error: null })
}));