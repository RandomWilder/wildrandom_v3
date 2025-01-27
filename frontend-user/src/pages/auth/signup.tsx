// src/pages/auth/signup.tsx

import { useState } from 'react';
import { NextPage } from 'next';
import Head from 'next/head';
import { useRouter } from 'next/router';
import axios from 'axios';
import { SignupForm } from '@/components/auth/SignupForm';
import type { RegistrationCredentials } from '@/types/auth';

const API_URL = 'http://127.0.0.1:5000/api';

const SignupPage: NextPage = () => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>();

  const handleSignup = async (data: RegistrationCredentials) => {
    setIsLoading(true);
    setError(undefined);
    
    try {
      const response = await axios.post(`${API_URL}/users/register`, data);
      
      // Store auth data if needed
      localStorage.setItem('user_email', response.data.email);
      
      // Redirect to success page with email
      router.push({
        pathname: '/auth/registration-success',
        query: { email: response.data.email }
      });
      
    } catch (err) {
      console.error('Registration failed:', err);
      if (axios.isAxiosError(err) && err.response?.data?.message) {
        setError(err.response.data.message);
      } else {
        setError('Registration failed. Please try again.');
      }
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
            <div className="p-6">
              <h1 className="text-2xl font-bold text-white text-center mb-6">
                Create Your Gaming Account
              </h1>
              
              <SignupForm
                onSubmit={handleSignup}
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

export default SignupPage;