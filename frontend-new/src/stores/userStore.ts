// src/stores/userStore.ts

import { create } from 'zustand';
import { userApi } from '@/api/userApi';
import type {
  BaseUser,
  CreateUserPayload,
  UpdateUserPayload,
  UpdateUserStatusPayload,
  UserFilters,
  EmailVerification,
  UserDetail
} from '@/types/users';

interface UserState {
  users: BaseUser[];
  totalUsers: number;
  currentPage: number;
  itemsPerPage: number;
  activeUser: UserDetail | null;
  isLoading: boolean;
  error: string | null;
  filters: UserFilters;
  
  fetchUsers: (filters?: UserFilters) => Promise<void>;
  searchUsers: (query: string) => Promise<void>;
  setFilters: (filters: UserFilters) => void;
  clearFilters: () => void;
  fetchUser: (id: number) => Promise<void>;
  createUser: (data: CreateUserPayload) => Promise<void>;
  updateUser: (id: number, data: UpdateUserPayload) => Promise<void>;
  updateUserStatus: (id: number, data: UpdateUserStatusPayload) => Promise<void>;
  verifyUser: (id: number) => Promise<EmailVerification>;
  clearActiveUser: () => void;
  clearError: () => void;
  setPagination: (page: number, itemsPerPage: number) => void;
}

const DEFAULT_ITEMS_PER_PAGE = 20;

const cleanFilters = (filters: UserFilters): UserFilters => {
  return Object.entries(filters).reduce((acc: UserFilters, [key, value]) => {
    if (value !== undefined && value !== null) {
      acc[key as keyof UserFilters] = value;
    }
    return acc;
  }, {});
};

export const useUserStore = create<UserState>((set, get) => ({
  users: [],
  totalUsers: 0,
  currentPage: 1,
  itemsPerPage: DEFAULT_ITEMS_PER_PAGE,
  activeUser: null,
  isLoading: false,
  error: null,
  filters: {},

  fetchUsers: async (filters?: UserFilters) => {
    try {
      set({ isLoading: true, error: null });
      const mergedFilters = cleanFilters({ ...get().filters, ...filters });
      
      const response = await userApi.listUsers(mergedFilters);
      
      set({
        users: response.users,
        totalUsers: response.total,
        currentPage: response.page,
        itemsPerPage: response.per_page,
        filters: mergedFilters,
        isLoading: false
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch users',
        isLoading: false
      });
    }
  },

  searchUsers: async (query: string) => {
    try {
      set({ isLoading: true, error: null });
      const response = await userApi.searchUsers(query);
      
      set({
        users: response.users,
        totalUsers: response.total,
        currentPage: 1,
        isLoading: false
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to search users',
        isLoading: false
      });
    }
  },

  setFilters: (filters: UserFilters) => {
    const cleanedFilters = cleanFilters(filters);
    set({ filters: cleanedFilters });
    get().fetchUsers(cleanedFilters);
  },

  clearFilters: () => {
    set({ filters: {} });
    get().fetchUsers();
  },

  fetchUser: async (id: number) => {
    try {
      set({ isLoading: true, error: null });
      const user = await userApi.getUser(id);
      set({ 
        activeUser: user, 
        isLoading: false 
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch user',
        isLoading: false,
        activeUser: null
      });
    }
  },

  createUser: async (data: CreateUserPayload) => {
    try {
      set({ isLoading: true, error: null });
      const user = await userApi.createUser(data);
      set(state => ({
        users: [user, ...state.users],
        totalUsers: state.totalUsers + 1,
        isLoading: false
      }));
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to create user', 
        isLoading: false 
      });
      throw error;
    }
  },

  updateUser: async (id: number, data: UpdateUserPayload) => {
    try {
      set({ isLoading: true, error: null });
      const updatedUser = await userApi.updateUser(id, data);
      set(state => ({
        users: state.users.map(user => user.id === id ? updatedUser : user),
        activeUser: state.activeUser?.id === id ? { ...state.activeUser, ...updatedUser } : state.activeUser,
        isLoading: false
      }));
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to update user', 
        isLoading: false 
      });
      throw error;
    }
  },

  updateUserStatus: async (id: number, data: UpdateUserStatusPayload) => {
    try {
      set({ isLoading: true, error: null });
      const updatedUser = await userApi.updateUserStatus(id, data);
      set(state => ({
        users: state.users.map(user => user.id === id ? updatedUser : user),
        activeUser: state.activeUser?.id === id ? { ...state.activeUser, ...updatedUser } : state.activeUser,
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

  verifyUser: async (id: number) => {
    try {
      set({ isLoading: true, error: null });
      const verification = await userApi.verifyUser(id);
      await get().fetchUser(id);
      return verification;
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to verify user', 
        isLoading: false 
      });
      throw error;
    }
  },

  clearActiveUser: () => set({ activeUser: null }),
  clearError: () => set({ error: null }),

  setPagination: (page: number, itemsPerPage: number) => {
    set({ currentPage: page, itemsPerPage });
    get().fetchUsers();
  }
}));