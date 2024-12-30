import { ReactNode } from 'react';
import { AdminRoute } from './routes';

export interface LayoutProps {
  children: ReactNode;
}

export interface PageWithLayout {
  layout?: (props: LayoutProps) => JSX.Element;
}

export interface LayoutRegistry {
  default: (props: LayoutProps) => JSX.Element;
  routes: Partial<Record<AdminRoute, (props: LayoutProps) => JSX.Element>>;
}