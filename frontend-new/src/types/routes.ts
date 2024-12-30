import type { LucideIcon } from 'lucide-react';

/**
 * Core routing types and configurations
 */

// Define all possible admin routes
export type AdminRoute = 
  // Dashboard
  | '/admin/dashboard'
  
  // Prize Management
  | '/admin/prizes/templates'
  | '/admin/prizes/templates/create'
  | '/admin/prizes/templates/[id]'
  | '/admin/prizes/pools'
  | '/admin/prizes/pools/create'
  | '/admin/prizes/pools/[id]'
  
  // Raffle Management
  | '/admin/raffles'
  | '/admin/raffles/create'
  | '/admin/raffles/[id]'
  | '/admin/raffles/[id]/prizes'
  | '/admin/raffles/[id]/participants'
  
  // User Management
  | '/admin/users'
  | '/admin/users/[id]'
  | '/admin/users/[id]/transactions'
  | '/admin/users/[id]/participations'
  
  // Analytics & Reporting
  | '/admin/analytics'
  | '/admin/analytics/users'
  | '/admin/analytics/revenue'
  | '/admin/analytics/prizes'
  
  // Settings & Configuration
  | '/admin/settings'
  | '/admin/settings/profile'
  | '/admin/settings/security';

// Navigation item structure
export interface NavigationItem {
  name: string;
  path: AdminRoute;
  icon: LucideIcon;  // Updated to use LucideIcon type
  children?: NavigationItem[];
  permissions?: string[];
}

// Page metadata
export interface PageMeta {
  title: string;
  description?: string;
  requireAuth: boolean;
  permissions?: string[];
}

// Route configuration
export interface RouteConfig {
  path: AdminRoute;
  meta: PageMeta;
}