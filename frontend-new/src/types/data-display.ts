/**
 * Enterprise Data Display Types
 * Provides type-safe structures for data manipulation
 */

// Sort Configuration
export type SortDirection = 'asc' | 'desc';

export interface SortConfig<T> {
  field: keyof T;
  direction: SortDirection;
}

// Filter Configuration
export interface FilterConfig<T> {
  field: keyof T;
  value: string | number | boolean;
  operator: 'equals' | 'contains' | 'greater' | 'less' | 'between';
}

// Search Configuration
export interface SearchConfig {
  query: string;
  fields: string[];
}

// Table Column Definition
export interface ColumnDef<T> {
  field: keyof T;
  header: string;
  sortable?: boolean;
  filterable?: boolean;
  searchable?: boolean;
  render?: (value: any, row: T) => React.ReactNode;
  width?: string;
  align?: 'left' | 'right' | 'center';
}