// src/pages/index.tsx
import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { AuthService } from '@/lib/auth';
import { motion } from 'framer-motion';

const LandingPage = () => {
  const router = useRouter();

  useEffect(() => {
    // Redirect authenticated users to dashboard
    if (AuthService.isAuthenticated()) {
      router.replace('/dashboard');
    }
  }, [router]);

  return (
    <div className="min-h-screen bg-surface-dark">
      <div className="container mx-auto px-4 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
            WildRandom Raffles
          </h1>
          <p className="text-xl text-gray-400 mb-12 max-w-2xl mx-auto">
            Experience the thrill of winning with our next-generation raffle platform
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => router.push('/auth/signup')}
              className="px-8 py-3 bg-game-500 text-white rounded-lg font-medium
                       hover:bg-game-600 transition-colors duration-200"
            >
              Get Started
            </motion.button>
            
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => router.push('/auth/login')}
              className="px-8 py-3 bg-surface-card text-white rounded-lg font-medium
                       hover:bg-surface-hover transition-colors duration-200"
            >
              Sign In
            </motion.button>
          </div>
        </motion.div>

        {/* Featured Raffles Preview */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="bg-surface-card p-6 rounded-xl border border-gray-800"
              onClick={() => router.push('/auth/login')}
            >
              <div className="bg-game-500/20 rounded-lg p-4 mb-4">
                <span className="text-game-400">Featured Prize</span>
              </div>
              <div className="space-y-2">
                <div className="h-4 w-3/4 bg-gray-800 rounded animate-pulse" />
                <div className="h-4 w-1/2 bg-gray-800 rounded animate-pulse" />
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default LandingPage;