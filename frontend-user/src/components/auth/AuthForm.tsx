// src/components/auth/AuthForm.tsx
import { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Lock, User, AlertCircle } from 'lucide-react';
import Link from 'next/link';

export interface AuthFormData {
  username: string;
  email?: string;  // Optional for login, required for signup
  password: string;
  confirmPassword?: string;
}

export interface AuthFormProps {
  mode: 'login' | 'signup';
  onSubmit: (data: AuthFormData) => Promise<void>;
  error?: string;
  isLoading?: boolean;
}

export const AuthForm = ({ mode, onSubmit, error, isLoading }: AuthFormProps) => {
  const [formData, setFormData] = useState<AuthFormData>({
    username: '',
    email: mode === 'signup' ? '' : undefined,
    password: '',
    confirmPassword: mode === 'signup' ? '' : undefined,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (mode === 'signup' && formData.password !== formData.confirmPassword) {
      // Handle password mismatch
      return;
    }

    const { confirmPassword, ...submitData } = formData;
    await onSubmit(submitData);
  };

  return (
    <motion.form 
      onSubmit={handleSubmit}
      className="space-y-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {error && (
        <div className="p-3 rounded-lg bg-accent-error/10 text-accent-error flex items-center">
          <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-300">Username</label>
        <div className="mt-1 relative">
          <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            value={formData.username}
            onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
            className="block w-full pl-10 pr-3 py-2 bg-surface-hover border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-game-500 focus:border-game-500"
            placeholder="Enter your username"
            required
            minLength={3}
            maxLength={64}
          />
        </div>
      </div>

      {mode === 'signup' && (
        <div>
          <label className="block text-sm font-medium text-gray-300">Email</label>
          <div className="mt-1 relative">
            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              className="block w-full pl-10 pr-3 py-2 bg-surface-hover border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-game-500 focus:border-game-500"
              placeholder="Enter your email"
              required={mode === 'signup'}
            />
          </div>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-300">Password</label>
        <div className="mt-1 relative">
          <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="password"
            value={formData.password}
            onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
            className="block w-full pl-10 pr-3 py-2 bg-surface-hover border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-game-500 focus:border-game-500"
            placeholder={mode === 'signup' ? 'Create a password' : 'Enter your password'}
            required
            minLength={8}
          />
        </div>
      </div>

      {mode === 'signup' && (
        <div>
          <label className="block text-sm font-medium text-gray-300">Confirm Password</label>
          <div className="mt-1 relative">
            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="password"
              value={formData.confirmPassword}
              onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
              className="block w-full pl-10 pr-3 py-2 bg-surface-hover border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-game-500 focus:border-game-500"
              placeholder="Confirm your password"
              required={mode === 'signup'}
              minLength={8}
            />
          </div>
        </div>
      )}

      <button
        type="submit"
        disabled={isLoading}
        className="w-full py-2 px-4 bg-game-500 hover:bg-game-600 text-white rounded-lg font-medium transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? 'Processing...' : mode === 'login' ? 'Sign In' : 'Create Account'}
      </button>

      <p className="text-center text-sm text-gray-400">
        {mode === 'login' ? (
          <>
            Don't have an account?{' '}
            <Link href="/auth/signup" className="text-game-400 hover:text-game-300">
              Sign up
            </Link>
          </>
        ) : (
          <>
            Already have an account?{' '}
            <Link href="/auth/login" className="text-game-400 hover:text-game-300">
              Sign in
            </Link>
          </>
        )}
      </p>
    </motion.form>
  );
};