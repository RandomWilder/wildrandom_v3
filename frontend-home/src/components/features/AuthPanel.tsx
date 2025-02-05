import { FC, useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence, PanInfo, useAnimation } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Button from '../common/Button';
import Input from '../common/Input';
import { loginSchema, registrationSchema } from '../../features/auth/schemas';
import type { LoginFormData, RegistrationFormData } from '../../features/auth/schemas';
import useAuth from '../../hooks/useAuth';
import { X } from '../common/icons';

interface AuthPanelProps {
  isVisible: boolean;
  onClose: () => void;
}

type AuthMode = 'login' | 'register';

const PANEL_HEIGHT = '90vh';
const DRAG_THRESHOLD = 150;

const AuthPanel: FC<AuthPanelProps> = ({ isVisible, onClose }) => {
  const [mode, setMode] = useState<AuthMode>('login');
  const { login, register: registerUser, isLoading } = useAuth();
  const controls = useAnimation();
  const panelRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  
  // Form initialization with Zod validation
  const loginForm = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: '',
      password: '',
      rememberMe: false
    }
  });

  const registerForm = useForm<RegistrationFormData>({
    resolver: zodResolver(registrationSchema),
    defaultValues: {
      username: '',
      email: '',
      password: '',
      confirmPassword: '',
      acceptTerms: false
    }
  });

  // Reset panel position when visibility changes
  useEffect(() => {
    if (isVisible) {
      controls.start({ y: 0 });
    }
  }, [isVisible, controls]);

  // Handle drag gestures
  const handleDragEnd = (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const shouldClose = info.offset.y > DRAG_THRESHOLD;
    if (shouldClose) {
      controls.start({ y: '100%' }).then(onClose);
    } else {
      controls.start({ y: 0 });
    }
    setIsDragging(false);
  };

  const handleLogin = async (data: LoginFormData) => {
    try {
      await login(data);
      onClose();
    } catch (error) {
      loginForm.setError('root', {
        message: error instanceof Error ? error.message : 'Login failed'
      });
    }
  };

  const handleRegister = async (data: RegistrationFormData) => {
    try {
      await registerUser(data);
      onClose();
    } catch (error) {
      registerForm.setError('root', {
        message: error instanceof Error ? error.message : 'Registration failed'
      });
    }
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <>
          {/* Backdrop with animated opacity */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
            onClick={!isDragging ? onClose : undefined}
          />

          {/* Sliding Panel with Gesture Support */}
          <motion.div
            ref={panelRef}
            initial={{ y: '100%' }}
            animate={controls}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={0.2}
            onDragStart={() => setIsDragging(true)}
            onDragEnd={handleDragEnd}
            className="fixed bottom-0 inset-x-0 z-50 bg-white rounded-t-xl shadow-xl"
            style={{ height: PANEL_HEIGHT, touchAction: 'none' }}
          >
            {/* Drag Handle */}
            <div className="absolute top-0 inset-x-0 h-8 cursor-grab active:cursor-grabbing">
              <div className="w-12 h-1.5 bg-gray-300 rounded-full mx-auto mt-3" />
            </div>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 transition-colors"
              aria-label="Close panel"
            >
              <X className="w-6 h-6 text-gray-500" />
            </button>

            {/* Panel Content */}
            <div className="h-full overflow-y-auto px-6 pt-12 pb-8">
              <div className="max-w-md mx-auto space-y-8">
                <h2 className="text-2xl font-bold text-gray-900">
                  {mode === 'login' ? 'Welcome Back' : 'Create Account'}
                </h2>

                {mode === 'login' ? (
                  <form onSubmit={loginForm.handleSubmit(handleLogin)} className="space-y-6">
                    <Input
                      label="Username"
                      error={loginForm.formState.errors.username?.message}
                      disabled={isLoading}
                      {...loginForm.register('username')}
                    />
                    
                    <Input
                      label="Password"
                      type="password"
                      error={loginForm.formState.errors.password?.message}
                      disabled={isLoading}
                      {...loginForm.register('password')}
                    />

                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="rememberMe"
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                        {...loginForm.register('rememberMe')}
                      />
                      <label htmlFor="rememberMe" className="ml-2 text-sm text-gray-900">
                        Remember me
                      </label>
                    </div>

                    {loginForm.formState.errors.root && (
                      <div className="text-sm text-red-600">
                        {loginForm.formState.errors.root.message}
                      </div>
                    )}

                    <Button
                      fullWidth
                      size="lg"
                      type="submit"
                      isLoading={isLoading}
                    >
                      Sign In
                    </Button>
                  </form>
                ) : (
                  <form onSubmit={registerForm.handleSubmit(handleRegister)} className="space-y-6">
                    <Input
                      label="Username"
                      error={registerForm.formState.errors.username?.message}
                      disabled={isLoading}
                      {...registerForm.register('username')}
                    />
                    
                    <Input
                      label="Email"
                      type="email"
                      error={registerForm.formState.errors.email?.message}
                      disabled={isLoading}
                      {...registerForm.register('email')}
                    />

                    <Input
                      label="Password"
                      type="password"
                      error={registerForm.formState.errors.password?.message}
                      disabled={isLoading}
                      {...registerForm.register('password')}
                    />

                    <Input
                      label="Confirm Password"
                      type="password"
                      error={registerForm.formState.errors.confirmPassword?.message}
                      disabled={isLoading}
                      {...registerForm.register('confirmPassword')}
                    />

                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="acceptTerms"
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                        {...registerForm.register('acceptTerms')}
                      />
                      <label htmlFor="acceptTerms" className="ml-2 text-sm text-gray-900">
                        I accept the terms and conditions
                      </label>
                    </div>

                    {registerForm.formState.errors.root && (
                      <div className="text-sm text-red-600">
                        {registerForm.formState.errors.root.message}
                      </div>
                    )}

                    <Button
                      fullWidth
                      size="lg"
                      type="submit"
                      isLoading={isLoading}
                    >
                      Create Account
                    </Button>
                  </form>
                )}

                {/* Mode Toggle */}
                <div className="text-center">
                  <button
                    onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
                    className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
                  >
                    {mode === 'login' 
                      ? "Don't have an account? Sign up" 
                      : "Already have an account? Sign in"}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default AuthPanel;