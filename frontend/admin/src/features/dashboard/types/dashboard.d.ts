export interface DashboardStats {
    label: string;
    value: string | number;
    trend?: {
      value: number;
      isPositive: boolean;
    };
    icon?: React.ComponentType<any>;
  }
  
  export interface DashboardFilters {
    dateRange: 'today' | 'week' | 'month' | 'year';
    category?: string;
    status?: string;
  }
  
  export interface DashboardConfig {
    refreshInterval: number;
    statDisplayMode: 'detailed' | 'summary';
    alertThreshold: {
      users: number;
      revenue: number;
      raffles: number;
    };
  }