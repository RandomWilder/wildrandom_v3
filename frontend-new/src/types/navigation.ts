import type { LucideIcon } from 'lucide-react';

// Core navigation route definition
export type AdminRoute =
  // Dashboard
  | '/admin/dashboard'
  // Prize Management
  | '/admin/prizes'
  | '/admin/prizes/templates'
  | '/admin/prizes/pools'
  // Raffles
  | '/admin/raffles'
  // Users
  | '/admin/users'
  // Analytics
  | '/admin/analytics'
  | '/admin/analytics/users'
  | '/admin/analytics/revenue'
  | '/admin/analytics/prizes'
  // Settings
  | '/admin/settings';

export interface NavigationItem {
  name: string;
  path: AdminRoute;
  icon: LucideIcon;
  children?: NavigationItem[];
  permissions?: string[];
}