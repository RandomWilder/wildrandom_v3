import { create } from 'zustand';
import { userCreditApi } from '@/api/userCreditApi';
import type {
  CreditTransaction,
  TransactionType,
  TransactionFilter,
  UserBalance,
  TransactionSummary,
  CreateTransactionPayload
} from '@/types/users';

interface CreditState {
  // Transaction Collection State
  transactions: CreditTransaction[];
  totalTransactions: number;
  currentPage: number;
  itemsPerPage: number;

  // Balance & Summary State
  userBalances: Record<number, UserBalance>;
  transactionSummary: TransactionSummary | null;

  // Filter State
  filters: TransactionFilter;
  
  // UI State
  isLoading: boolean;
  isProcessing: boolean;
  error: string | null;
  
  // Transaction Collection Actions
  fetchTransactions: (filters?: TransactionFilter) => Promise<void>;
  fetchUserTransactions: (userId: number, filters?: TransactionFilter) => Promise<void>;
  
  // Balance Management Actions
  fetchUserBalance: (userId: number) => Promise<void>;
  adjustUserCredits: (userId: number, amount: number, notes: string) => Promise<void>;
  validateTransaction: (
    userId: number,
    amount: number,
    type: TransactionType
  ) => Promise<{ valid: boolean; message?: string }>;
  
  // Summary & Analysis Actions
  fetchTransactionSummary: (startDate?: string, endDate?: string) => Promise<void>;
  
  // Filter Actions
  setFilters: (filters: TransactionFilter) => void;
  clearFilters: () => void;
  
  // Utility Actions
  clearError: () => void;
  setPagination: (page: number, itemsPerPage: number) => void;
}

const DEFAULT_ITEMS_PER_PAGE = 20;

export const useCreditStore = create<CreditState>((set, get) => ({
  // Initial State
  transactions: [],
  totalTransactions: 0,
  currentPage: 1,
  itemsPerPage: DEFAULT_ITEMS_PER_PAGE,
  userBalances: {},
  transactionSummary: null,
  filters: {},
  isLoading: false,
  isProcessing: false,
  error: null,

  // Transaction Collection Actions
  fetchTransactions: async (filters?: TransactionFilter) => {
    try {
      set({ isLoading: true, error: null });
      const mergedFilters = { ...get().filters, ...filters };
      const { transactions, total } = await userCreditApi.listTransactions(mergedFilters);
      
      set({
        transactions,
        totalTransactions: total,
        filters: mergedFilters,
        isLoading: false
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch transactions',
        isLoading: false
      });
    }
  },

  fetchUserTransactions: async (userId: number, filters?: TransactionFilter) => {
    try {
      set({ isLoading: true, error: null });
      const mergedFilters = { ...get().filters, ...filters };
      const { transactions, total } = await userCreditApi.getUserTransactions(userId, mergedFilters);
      
      set({
        transactions,
        totalTransactions: total,
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

  // Balance Management Actions
  fetchUserBalance: async (userId: number) => {
    try {
      set({ isLoading: true, error: null });
      const balance = await userCreditApi.getUserBalance(userId);
      
      set(state => ({
        userBalances: {
          ...state.userBalances,
          [userId]: balance
        },
        isLoading: false
      }));
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch user balance',
        isLoading: false
      });
    }
  },

  adjustUserCredits: async (userId: number, amount: number, notes: string) => {
    try {
      set({ isProcessing: true, error: null });
      
      // Pre-validate the transaction
      const { valid, message } = await userCreditApi.validateTransaction(
        userId,
        amount,
        'admin_adjustment'
      );
      
      if (!valid) {
        throw new Error(message || 'Invalid credit adjustment');
      }

      // Process the adjustment
      const transaction = await userCreditApi.adjustCredits(userId, amount, notes);

      // Update local state optimistically
      set(state => ({
        transactions: [transaction, ...state.transactions],
        totalTransactions: state.totalTransactions + 1,
        isProcessing: false
      }));

      // Refresh user balance after adjustment
      await get().fetchUserBalance(userId);
      
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to adjust credits',
        isProcessing: false
      });
      throw error;
    }
  },

  validateTransaction: async (userId: number, amount: number, type: TransactionType) => {
    try {
      set({ isProcessing: true, error: null });
      const result = await userCreditApi.validateTransaction(userId, amount, type);
      set({ isProcessing: false });
      return result;
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to validate transaction',
        isProcessing: false
      });
      throw error;
    }
  },

  // Summary & Analysis Actions
  fetchTransactionSummary: async (startDate?: string, endDate?: string) => {
    try {
      set({ isLoading: true, error: null });
      const summary = await userCreditApi.getTransactionSummary(startDate, endDate);
      set({ transactionSummary: summary, isLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch transaction summary',
        isLoading: false
      });
    }
  },

  // Filter Actions
  setFilters: (filters: TransactionFilter) => {
    set({ filters });
    get().fetchTransactions(filters);
  },

  clearFilters: () => {
    set({ filters: {} });
    get().fetchTransactions();
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
    get().fetchTransactions();
  }
}));