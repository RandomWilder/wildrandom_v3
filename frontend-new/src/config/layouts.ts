import { LayoutRegistry } from '@/types/layouts';
import { BaseLayout } from '@/components/layout/BaseLayout';
import { AdminLayout } from '@/components/layout/AdminLayout';

export const layouts: LayoutRegistry = {
  default: BaseLayout,
  routes: {
    '/admin/dashboard': AdminLayout,
    '/admin/prizes/templates': AdminLayout,
    '/admin/prizes/templates/create': AdminLayout,
    '/admin/prizes/templates/[id]': AdminLayout,
    '/admin/prizes/pools': AdminLayout,
    '/admin/prizes/pools/create': AdminLayout,
    '/admin/prizes/pools/[id]': AdminLayout,
    '/admin/raffles': AdminLayout,
    '/admin/raffles/create': AdminLayout,
    '/admin/raffles/[id]': AdminLayout,
    '/admin/users': AdminLayout,
    '/admin/users/[id]': AdminLayout,
    '/admin/analytics': AdminLayout,
    '/admin/settings': AdminLayout,
  }
};