// src/components/auth/AuthCard.tsx
import { motion } from 'framer-motion';
import { ReactNode } from 'react';

interface AuthCardProps {
  children: ReactNode;
  title: string;
}

export const AuthCard = ({ children, title }: AuthCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="w-full max-w-md mx-auto bg-surface-dark rounded-xl shadow-2xl overflow-hidden border border-game-600/20"
    >
      <div className="relative p-8">
        <div className="absolute inset-0 bg-gradient-to-br from-game-600/10 to-transparent" />
        <div className="relative">
          <h2 className="text-2xl font-bold text-white text-center mb-6">{title}</h2>
          {children}
        </div>
      </div>
    </motion.div>
  );
};