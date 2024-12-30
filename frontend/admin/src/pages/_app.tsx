import type { AppProps } from 'next/app';
import { AuthGuard } from '@/features/auth/components/AuthGuard';
import '@/styles/globals.css';

export default function App({ Component, pageProps }: AppProps) {
  // @ts-ignore - auth flag for public routes
  const requireAuth = Component.auth !== false;

  return requireAuth ? (
    <AuthGuard>
      <Component {...pageProps} />
    </AuthGuard>
  ) : (
    <Component {...pageProps} />
  );
}