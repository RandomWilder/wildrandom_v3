// src/pages/auth/login.tsx
import { useState } from 'react';
import { NextPage } from 'next';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { AuthService } from '@/lib/auth';
import { LoginForm } from '@/components/auth/LoginForm';
import type { LoginCredentials } from '@/types/auth.types';
import { ROUTES } from '@/config/routes';

const LoginPage: NextPage = () => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>();

  const handleLogin = async (credentials: LoginCredentials) => {
    setIsLoading(true);
    setError(undefined);

    try {
      // Clear any existing session before new login
      AuthService.clearAuthData();
      
      const response = await AuthService.login(credentials);
      
      if (!response.success) {
        throw new Error(response.error || 'Authentication failed');
      }

      // Always redirect to dashboard, regardless of verification status
      router.replace(ROUTES.protected.dashboard);

    } catch (error: any) {
      console.error('Authentication failed:', error);
      setError(error.message || 'Login failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Login | WildRandom</title>
        <meta name="description" content="Access your WildRandom gaming account" />
      </Head>

      <LoginForm 
        onSubmit={handleLogin}
        isLoading={isLoading}
        error={error}
      />
    </>
  );
};

export default LoginPage;