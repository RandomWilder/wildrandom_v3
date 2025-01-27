// src/pages/auth/registration-success.tsx

import { NextPage } from 'next';
import Head from 'next/head';
import { motion } from 'framer-motion';
import { useRouter } from 'next/router';
import { useEffect } from 'react';
import { Mail, ArrowRight } from 'lucide-react';

const RegistrationSuccessPage: NextPage = () => {
  const router = useRouter();
  const { email } = router.query;

  useEffect(() => {
    // If no email in query, user shouldn't be here
    if (!email && typeof window !== 'undefined') {
      router.replace('/auth/login');
    }
  }, [email, router]);

  return (
    <>
      <Head>
        <title>Registration Successful | WildRandom</title>
        <meta name="description" content="Welcome to WildRandom - Your account has been created" />
      </Head>

      <div className="min-h-screen bg-surface-dark flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <motion.div 
            className="bg-surface-card rounded-xl shadow-xl overflow-hidden"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="p-6">
              <div className="text-center mb-6">
                <motion.div
                  className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-game-500/20 mb-4"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", delay: 0.2 }}
                >
                  <Mail className="w-8 h-8 text-game-500" />
                </motion.div>
                <h1 className="text-2xl font-bold text-white">Welcome to WildRandom!</h1>
                <p className="text-gray-400 mt-2">Your gaming journey begins here</p>
              </div>

              <div className="space-y-4">
                <div className="bg-surface-dark rounded-lg p-4">
                  <h2 className="font-medium text-white">Next Steps:</h2>
                  <ul className="mt-2 space-y-2">
                    <li className="flex items-start text-sm text-gray-300">
                      <span className="flex-shrink-0 w-5 h-5 rounded-full bg-game-500/20 flex items-center justify-center mr-2 mt-0.5">
                        1
                      </span>
                      Check your email ({email}) for verification link
                    </li>
                    <li className="flex items-start text-sm text-gray-300">
                      <span className="flex-shrink-0 w-5 h-5 rounded-full bg-game-500/20 flex items-center justify-center mr-2 mt-0.5">
                        2
                      </span>
                      Verify your account to unlock all features
                    </li>
                    <li className="flex items-start text-sm text-gray-300">
                      <span className="flex-shrink-0 w-5 h-5 rounded-full bg-game-500/20 flex items-center justify-center mr-2 mt-0.5">
                        3
                      </span>
                      Start exploring available games
                    </li>
                  </ul>
                </div>

                <button
                  onClick={() => router.push('/auth/login')}
                  className="w-full flex items-center justify-center py-3 px-4 bg-game-500 text-white rounded-lg font-medium 
                           hover:bg-game-600 focus:outline-none focus:ring-2 focus:ring-game-500 focus:ring-offset-2 
                           transition-colors duration-200"
                >
                  Continue to Login
                  <ArrowRight className="ml-2 w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </>
  );
};

export default RegistrationSuccessPage;