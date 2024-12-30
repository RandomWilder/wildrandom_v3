import { 
    LayoutGrid, 
    Trophy, 
    Gift, 
    Users, 
    BarChart4,
    BarChart,
    Settings, 
    DollarSign,
    Store
  } from 'lucide-react';
  import type { NavigationItem } from '@/types/navigation';
  
  export const ADMIN_NAVIGATION: NavigationItem[] = [
    {
      name: 'Dashboard',
      path: '/admin/dashboard',
      icon: LayoutGrid
    },
    {
      name: 'Prize Management',
      path: '/admin/prizes',
      icon: Trophy,
      children: [
        {
          name: 'Templates',
          path: '/admin/prizes/templates',
          icon: Trophy
        },
        {
          name: 'Prize Pools',
          path: '/admin/prizes/pools',
          icon: Store
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
          icon: BarChart
        },
        {
          name: 'Revenue',
          path: '/admin/analytics/revenue',
          icon: DollarSign
        },
        {
          name: 'Prize Analytics',
          path: '/admin/analytics/prizes',
          icon: Trophy
        }
      ]
    },
    {
      name: 'Settings',
      path: '/admin/settings',
      icon: Settings,
    }
  ];