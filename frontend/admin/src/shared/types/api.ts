// frontend/admin/src/shared/types/api.ts

import type { AxiosResponse } from 'axios';

// Generic API response wrapper
export interface ApiResponse<T> {
  data: T;
  message?: string;
  status: 'success' | 'error';
}

// Unwrap axios response helper
export type UnwrapApiResponse<T> = T extends AxiosResponse<infer U> ? U : never;