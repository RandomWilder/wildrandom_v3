// src/components/auth/RegistrationProgress.tsx

import { motion } from 'framer-motion';
import { CheckCircle2, Circle, AlertCircle } from 'lucide-react';
import type { RegistrationStep } from '@/types/auth';

interface RegistrationProgressProps {
  currentStep: RegistrationStep;
  progress: number;
  error?: string;
}

interface StepConfig {
  label: string;
  description: string;
  achievement?: string;
}

const STEPS: Record<RegistrationStep, StepConfig> = {
  initial: {
    label: 'Start',
    description: 'Begin your gaming journey',
    achievement: '🎮 Adventure Begins!'
  },
  form_filling: {
    label: 'Profile',
    description: 'Create your identity',
    achievement: '📝 Profile Pioneer'
  },
  validation: {
    label: 'Verification',
    description: 'Securing your account',
    achievement: '🛡️ Security First'
  },
  submission: {
    label: 'Registration',
    description: 'Completing setup',
    achievement: '🌟 Almost There'
  },
  success: {
    label: 'Complete',
    description: 'Ready to play',
    achievement: '🏆 Account Created!'
  },
  verification_pending: {
    label: 'Verify Email',
    description: 'Check your inbox',
    achievement: '📧 Email Master'
  }
};

const stepOrder: RegistrationStep[] = [
  'initial',
  'form_filling',
  'validation',
  'submission',
  'success',
  'verification_pending'
];

export const RegistrationProgress: React.FC<RegistrationProgressProps> = ({
  currentStep,
  progress,
  error
}) => {
  const currentStepIndex = stepOrder.indexOf(currentStep);

  return (
    <div className="w-full max-w-md mx-auto mb-8">
      {/* Progress Bar */}
      <motion.div className="relative h-2 bg-gray-700 rounded-full overflow-hidden mb-6">
        <motion.div
          className="absolute top-0 left-0 h-full bg-game-500"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        />
      </motion.div>

      {/* Steps */}
      <div className="relative">
        {stepOrder.map((step, index) => {
          const isComplete = index < currentStepIndex;
          const isCurrent = index === currentStepIndex;
          const config = STEPS[step];

          return (
            <motion.div
              key={step}
              className={`flex items-start mb-4 ${
                isCurrent ? 'opacity-100' : 'opacity-60'
              }`}
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: isCurrent || isComplete ? 1 : 0.6 }}
              transition={{ delay: index * 0.1 }}
            >
              {/* Step Icon */}
              <div className="flex-shrink-0 mr-3">
                {isComplete ? (
                  <CheckCircle2 className="w-6 h-6 text-green-500" />
                ) : isCurrent ? (
                  <Circle className="w-6 h-6 text-game-500" />
                ) : (
                  <Circle className="w-6 h-6 text-gray-500" />
                )}
              </div>

              {/* Step Content */}
              <div className="flex-1">
                <h4 className="text-sm font-medium text-white">
                  {config.label}
                </h4>
                <p className="text-xs text-gray-400">
                  {config.description}
                </p>

                {/* Achievement Badge */}
                {isComplete && config.achievement && (
                  <motion.div
                    className="mt-1 text-xs text-game-400"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    {config.achievement}
                  </motion.div>
                )}
              </div>
            </motion.div>
          );
        })}

        {/* Error State */}
        {error && (
          <motion.div
            className="flex items-center mt-4 p-3 bg-red-500/10 rounded-lg"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
            <p className="text-sm text-red-500">{error}</p>
          </motion.div>
        )}
      </div>
    </div>
  );
};