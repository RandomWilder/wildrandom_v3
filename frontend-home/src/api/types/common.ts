/**
 * Core API Response Types
 * 
 * Implements consistent response patterns and error handling across all services.
 * Ensures proper type discrimination and null safety.
 * 
 * Architectural Considerations:
 * - Strict null safety (no undefined values in responses)
 * - Discriminated unions for type narrowing
 * - Comprehensive error type system
 * - Backend alignment with FastAPI response schemas
 */

/**
 * Standard API response wrapper ensuring type safety across service boundaries
 * @template T The expected data type for successful responses
 */
export interface ApiResponse<T> {
    data: T | null;
    error: ApiError | null;
  }
  
  /**
   * Standardized error structure aligned with backend error handling
   */
  export interface ApiError {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  }
  
  /**
   * Pagination metadata interface for list responses
   */
  export interface PaginationMeta {
    page: number;
    per_page: number;
    total: number;
    total_pages: number;
  }
  
  /**
   * Paginated response wrapper implementing standard pagination pattern
   * @template T The type of items being paginated
   */
  export interface PaginatedResponse<T> extends ApiResponse<T[]> {
    pagination: PaginationMeta | null;
  }
  
  /**
   * Type guard for API error responses
   * Enables proper error handling patterns with type narrowing
   */
  export function isApiError<T>(
    response: ApiResponse<T>
  ): response is ApiResponse<T> & { error: ApiError; data: null } {
    return response.error !== null;
  }
  
  /**
   * Type guard for successful API responses
   * Enables proper success handling with type narrowing
   */
  export function isApiSuccess<T>(
    response: ApiResponse<T>
  ): response is ApiResponse<T> & { data: T; error: null } {
    return response.data !== null;
  }
  
  /**
   * Helper to create a typed error response
   * Ensures consistent error structure across service boundaries
   */
  export function createApiError(
    code: string,
    message: string,
    details?: Record<string, unknown>
  ): ApiResponse<never> {
    return {
      data: null,
      error: { code, message, details }
    };
  }
  
  /**
   * Helper to create a typed success response
   * Ensures consistent success structure across service boundaries
   */
  export function createApiSuccess<T>(data: T): ApiResponse<T> {
    return {
      data,
      error: null
    };
  }
  
  /**
   * Helper to create a typed paginated response
   * Ensures consistent pagination structure across service boundaries
   */
  export function createPaginatedResponse<T>(
    items: T[],
    meta: PaginationMeta
  ): PaginatedResponse<T> {
    return {
      data: items,
      error: null,
      pagination: meta
    };
  }