import { NavigationItem, RouteConfig } from '@/types/routes';
import {
  LayoutGrid,
  Trophy,
  Gift,
  Users,
  BarChart4,
  Settings,
  Database,
  Award,
  UserCheck,
  DollarSign,
  Store
} from 'lucide-react';

/**
 * Main navigation structure
 */
export const mainNavigation: NavigationItem[] = [
  {
    name: 'Dashboard',
    path: '/admin/dashboard',
    icon: LayoutGrid,
  },
  {
    name: 'Prize Management',
    path: '/admin/prizes/templates',
    icon: Trophy,
    children: [
      {
        name: 'Templates',
        path: '/admin/prizes/templates',
        icon: Award,
      },
      {
        name: 'Prize Pools',
        path: '/admin/prizes/pools',
        icon: Store,
      }
    ]
  },
  {
    name: 'Raffles',
    path: '/admin/raffles',
    icon: Gift,
  },
  {
    name: 'Users',
    path: '/admin/users',
    icon: Users,
  },
  {
    name: 'Analytics',
    path: '/admin/analytics',
    icon: BarChart4,
    children: [
      {
        name: 'User Analytics',
        path: '/admin/analytics/users',
        icon: UserCheck,
      },
      {
        name: 'Revenue',
        path: '/admin/analytics/revenue',
        icon: DollarSign,
      },
      {
        name: 'Prize Analytics',
        path: '/admin/analytics/prizes',
        icon: Trophy,
      }
    ]
  },
  {
    name: 'Settings',
    path: '/admin/settings',
    icon: Settings,
  }
] as const;

/**
 * Route configurations with metadata
 */
export const routeConfigs: Record<string, RouteConfig> = {
  dashboard: {
    path: '/admin/dashboard',
    meta: {
      title: 'Dashboard',
      description: 'Administrative overview and quick actions',
      requireAuth: true,
    }
  },
  prizes: {
    path: '/admin/prizes/templates',
    meta: {
      title: 'Prize Templates',
      description: 'Manage prize templates and configurations',
      requireAuth: true,
      permissions: ['manage_prizes']
    }
  },
  prizePools: {
    path: '/admin/prizes/pools',
    meta: {
      title: 'Prize Pools',
      description: 'Manage active prize pools',
      requireAuth: true,
      permissions: ['manage_prizes']
    }
  },
  raffles: {
    path: '/admin/raffles',
    meta: {
      title: 'Raffles',
      description: 'Manage raffle events and drawings',
      requireAuth: true,
      permissions: ['manage_raffles']
    }
  },
  users: {
    path: '/admin/users',
    meta: {
      title: 'User Management',
      description: 'Manage user accounts and permissions',
      requireAuth: true,
      permissions: ['manage_users']
    }
  },
  analytics: {
    path: '/admin/analytics',
    meta: {
      title: 'Analytics',
      description: 'System analytics and reporting',
      requireAuth: true,
      permissions: ['view_analytics']
    }
  },
  settings: {
    path: '/admin/settings',
    meta: {
      title: 'Settings',
      description: 'System configuration and preferences',
      requireAuth: true,
      permissions: ['manage_settings']
    }
  }
};

/**
 * Helper to get route configuration
 */
export function getRouteConfig(path: string): RouteConfig | undefined {
  return Object.values(routeConfigs).find(config => config.path === path);
}

/**
 * Helper to check if a route requires authentication
 */
export function requiresAuth(path: string): boolean {
  const config = getRouteConfig(path);
  return config?.meta.requireAuth ?? true;
}