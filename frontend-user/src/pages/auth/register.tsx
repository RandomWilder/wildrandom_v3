// src/pages/auth/register.tsx

import { useState } from 'react';
import { NextPage } from 'next';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { AuthService } from '@/lib/auth';
import { RegistrationForm } from '@/components/auth/RegistrationForm';  // Correct import path
import type { RegisterCredentials } from '@/types/auth.types';
import { AUTH_ROUTES } from '@/config/api.config';

const RegisterPage: NextPage = () => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>();

  const handleRegister = async (credentials: RegisterCredentials) => {
    setIsLoading(true);
    setError(undefined);

    try {
      const response = await AuthService.register(credentials);
      
      // Store email for verification flow
      sessionStorage.setItem('registered_email', response.user.email);
      
      // Redirect to success page
      router.push({
        pathname: AUTH_ROUTES.SUCCESS,
        query: { email: response.user.email }
      });
    } catch (error: any) {
      console.error('Registration error:', error);
      setError(error.data?.error || 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Create Account | WildRandom</title>
        <meta name="description" content="Join WildRandom - Create your gaming account" />
      </Head>

      <div className="min-h-screen bg-surface-dark flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-surface-card rounded-xl shadow-xl overflow-hidden">
            <div className="p-6 space-y-6">
              <h1 className="text-2xl font-bold text-white text-center">
                Create Your Gaming Account
              </h1>

              <RegistrationForm
                onSubmit={handleRegister}
                isLoading={isLoading}
                error={error}
              />
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default RegisterPage;