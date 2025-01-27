// src/pages/auth/success.tsx

import { useEffect } from 'react';
import { NextPage } from 'next';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { motion } from 'framer-motion';
import { Mail, ArrowRight, Check } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { AuthService } from '@/lib/auth';
import type { ApiErrorResponse } from '@/types/auth.types';

const SuccessPage: NextPage = () => {
  const router = useRouter();
  const { email } = router.query;

  useEffect(() => {
    // Security check - ensure we have registration context
    if (!email && typeof window !== 'undefined') {
      const storedEmail = sessionStorage.getItem('registered_email');
      if (!storedEmail) {
        router.replace('/auth/login');
      }
    }
  }, [email, router]);

  const handleResendVerification = async () => {
    try {
      await AuthService.verifyEmail();
      // Show success notification (implement based on your notification system)
    } catch (error) {
      const apiError = error as ApiErrorResponse;
      console.error('Verification email resend failed:', apiError);
      // Show error notification (implement based on your notification system)
    }
  };

  return (
    <>
      <Head>
        <title>Registration Successful | WildRandom</title>
        <meta name="description" content="Your gaming journey begins - Account created successfully" />
      </Head>

      <div className="min-h-screen bg-surface-dark flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <motion.div
            className="bg-surface-card rounded-xl shadow-xl overflow-hidden"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="p-8">
              {/* Success Icon */}
              <div className="flex justify-center mb-6">
                <motion.div
                  className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", delay: 0.2 }}
                >
                  <Check className="w-8 h-8 text-green-500" />
                </motion.div>
              </div>

              {/* Success Message */}
              <div className="text-center mb-8">
                <h1 className="text-2xl font-bold text-white mb-2">
                  Welcome to WildRandom!
                </h1>
                <p className="text-gray-400">
                  Your account has been created successfully
                </p>
              </div>

              {/* Next Steps */}
              <div className="bg-surface-dark rounded-lg p-4 mb-6">
                <h2 className="font-medium text-white mb-4">Next Steps:</h2>
                <ol className="space-y-4">
                  <motion.li
                    className="flex items-start"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 }}
                  >
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-game-500/20 flex items-center justify-center mr-3 mt-0.5">
                      1
                    </span>
                    <div>
                      <p className="text-sm text-gray-300">
                        Check your email
                        {email && (
                          <span className="block text-game-400 mt-1">
                            {email}
                          </span>
                        )}
                      </p>
                    </div>
                  </motion.li>

                  <motion.li
                    className="flex items-start"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 }}
                  >
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-game-500/20 flex items-center justify-center mr-3 mt-0.5">
                      2
                    </span>
                    <p className="text-sm text-gray-300">
                      Click the verification link we sent you
                    </p>
                  </motion.li>

                  <motion.li
                    className="flex items-start"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 }}
                  >
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-game-500/20 flex items-center justify-center mr-3 mt-0.5">
                      3
                    </span>
                    <p className="text-sm text-gray-300">
                      Log in to start your gaming journey
                    </p>
                  </motion.li>
                </ol>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3">
                <Button
                  variant="primary"
                  className="w-full"
                  onClick={() => router.push('/auth/login')}
                >
                  <span>Continue to Login</span>
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Button>

                <Button
                  variant="ghost"
                  className="w-full"
                  onClick={handleResendVerification}
                >
                  <Mail className="w-4 h-4 mr-2" />
                  <span>Resend verification email</span>
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </>
  );
};

export default SuccessPage;