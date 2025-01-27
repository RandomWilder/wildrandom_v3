// Generated TypeScript types for WildRandom API
// Generated at: 2025-01-24T15:35:22.559839+00:00

export interface ApiResponse<T = any> {
    status: 'success' | 'error' | 'pending';
    data?: T;
    error?: string;
    metadata: Record<string, any>;
}

export interface RequestBase {
    request_id?: string;
    timestamp?: string;
    client_version?: string;
}

export interface PaginatedResponse<T> {
    items: T[];
    total: number;
    page: number;
    per_page: number;
    total_pages: number;
}
