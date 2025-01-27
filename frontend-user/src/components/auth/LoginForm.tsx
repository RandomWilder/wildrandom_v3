// src/components/auth/LoginForm.tsx
import { useState } from 'react';
import { motion } from 'framer-motion';
import { User, Lock, AlertCircle } from 'lucide-react';
import type { LoginCredentials } from '@/types/auth.types';

interface LoginFormProps {
  onSubmit: (credentials: LoginCredentials) => Promise<void>;
  isLoading: boolean;
  error?: string;
}

export const LoginForm: React.FC<LoginFormProps> = ({ onSubmit, isLoading, error }) => {
  const [credentials, setCredentials] = useState<LoginCredentials>({
    username: '',
    password: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;
    await onSubmit(credentials);
  };

  return (
    <div className="min-h-screen bg-surface-dark flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <motion.div
          className="bg-surface-card rounded-xl shadow-xl overflow-hidden"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="p-6 space-y-6">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-white">Welcome Back!</h1>
              <p className="text-gray-400 mt-2">Login to continue your journey</p>
            </div>

            {error && (
              <motion.div
                className="p-3 rounded-lg bg-accent-error/10 text-accent-error flex items-center"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0" />
                <span className="text-sm">{error}</span>
              </motion.div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1">
                <label htmlFor="username" className="block text-sm font-medium text-gray-200">
                  Username
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    id="username"
                    type="text"
                    value={credentials.username}
                    onChange={(e) => setCredentials(prev => ({
                      ...prev,
                      username: e.target.value
                    }))}
                    className="w-full pl-10 pr-3 py-2 bg-surface-dark border border-gray-700 rounded-lg
                             text-white placeholder-gray-400 focus:border-game-500 focus:ring-1 focus:ring-game-500"
                    placeholder="Enter your username"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label htmlFor="password" className="block text-sm font-medium text-gray-200">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    id="password"
                    type="password"
                    value={credentials.password}
                    onChange={(e) => setCredentials(prev => ({
                      ...prev,
                      password: e.target.value
                    }))}
                    className="w-full pl-10 pr-3 py-2 bg-surface-dark border border-gray-700 rounded-lg
                             text-white placeholder-gray-400 focus:border-game-500 focus:ring-1 focus:ring-game-500"
                    placeholder="Enter your password"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 px-4 bg-game-500 text-white rounded-lg font-medium
                         hover:bg-game-600 focus:ring-2 focus:ring-game-500 focus:ring-offset-2
                         disabled:opacity-50 disabled:cursor-not-allowed transition-colors
                         transform hover:scale-[1.02] active:scale-[0.98]"
              >
                {isLoading ? (
                  <motion.div
                    className="flex items-center justify-center"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Signing In...
                  </motion.div>
                ) : (
                  'Sign In'
                )}
              </button>
            </form>
          </div>
        </motion.div>
      </div>
    </div>
  );
};