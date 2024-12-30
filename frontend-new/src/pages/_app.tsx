import type { AppProps } from 'next/app';
import { Inter } from 'next/font/google';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { layouts } from '@/config/layouts';
import type { PageWithLayout } from '@/types/layouts';
import '@/styles/globals.css';

const inter = Inter({ subsets: ['latin'] });

type AppPropsWithLayout = AppProps & {
  Component: PageWithLayout & {
    requireAuth?: boolean;
  };
}

export default function App({ Component, pageProps, router }: AppPropsWithLayout) {
  // Get layout for current route
  const Layout = Component.layout || 
    layouts.routes[router.pathname as keyof typeof layouts.routes] ||
    layouts.default;

  // Determine if route requires authentication
  const requireAuth = Component.requireAuth !== false;

  const PageContent = (
    <Layout>
      <Component {...pageProps} />
    </Layout>
  );

  return (
    <div className={inter.className}>
      {requireAuth ? (
        <AuthGuard>{PageContent}</AuthGuard>
      ) : (
        PageContent
      )}
    </div>
  );
}