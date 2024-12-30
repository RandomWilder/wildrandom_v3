import {
    LayoutGrid,
    Trophy,
    Gift,
    Users,
    BarChart4,
    BarChart,
    Settings,
    LogOut,
    Menu,
    X,
    DollarSign
  } from 'lucide-react';
  import type { LucideIcon } from 'lucide-react';
  
  // Type-safe icon registry
  export const AdminIcons: Record<string, LucideIcon> = {
    dashboard: LayoutGrid,
    prizes: Trophy,
    raffles: Gift,
    users: Users,
    analytics: BarChart4,
    userAnalytics: BarChart,
    revenue: DollarSign,
    prizeAnalytics: Trophy,
    settings: Settings,
    logout: LogOut,
    menu: Menu,
    close: X
  };
  
  export type AdminIconName = keyof typeof AdminIcons;