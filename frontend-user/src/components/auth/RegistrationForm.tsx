// src/components/auth/RegistrationForm.tsx

import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { User, Mail, Lock, UserCircle, Phone } from 'lucide-react';
import type { RegisterCredentials } from '@/types/auth.types';
import { Button } from '@/components/ui/Button';  // Using existing UI components

interface FormField {
  value: string;
  error?: string;
  touched: boolean;
}

interface RegistrationFormProps {
  onSubmit: (data: RegisterCredentials) => Promise<void>;
  isLoading: boolean;
  error?: string;
}

interface FormState {
  username: FormField;
  email: FormField;
  password: FormField;
  first_name: FormField;
  last_name: FormField;
  phone_number: FormField;
}

const initialFormState: FormState = {
  username: { value: '', touched: false },
  email: { value: '', touched: false },
  password: { value: '', touched: false },
  first_name: { value: '', touched: false },
  last_name: { value: '', touched: false },
  phone_number: { value: '', touched: false }
};

export const RegistrationForm: React.FC<RegistrationFormProps> = ({
  onSubmit,
  isLoading,
  error
}) => {
  const [form, setForm] = useState<FormState>(initialFormState);

  const validateField = useCallback((field: keyof FormState, value: string): string | undefined => {
    switch (field) {
      case 'username':
        if (!value) return 'Username is required';
        if (value.length < 3) return 'Username must be at least 3 characters';
        if (value.length > 64) return 'Username must be less than 64 characters';
        if (!/^[a-zA-Z0-9_-]*$/.test(value)) return 'Only letters, numbers, underscore and hyphen allowed';
        return undefined;

      case 'email':
        if (!value) return 'Email is required';
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'Invalid email format';
        return undefined;

      case 'password':
        if (!value) return 'Password is required';
        if (value.length < 8) return 'Password must be at least 8 characters';
        if (!/[A-Z]/.test(value)) return 'Password must include an uppercase letter';
        if (!/[a-z]/.test(value)) return 'Password must include a lowercase letter';
        if (!/[0-9]/.test(value)) return 'Password must include a number';
        if (!/[^A-Za-z0-9]/.test(value)) return 'Password must include a special character';
        return undefined;

      default:
        return undefined;
    }
  }, []);

  const handleChange = useCallback((field: keyof FormState) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = e.target.value;
    const error = validateField(field, value);
    
    setForm(prev => ({
      ...prev,
      [field]: {
        value,
        error,
        touched: true
      }
    }));
  }, [validateField]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;

    const credentials: RegisterCredentials = {
      username: form.username.value,
      email: form.email.value,
      password: form.password.value,
      first_name: form.first_name.value || undefined,
      last_name: form.last_name.value || undefined,
      phone_number: form.phone_number.value || undefined
    };

    await onSubmit(credentials);
  }, [form, isLoading, onSubmit]);

  const isFormValid = !form.username.error && !form.email.error && !form.password.error &&
    form.username.touched && form.email.touched && form.password.touched;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-3 rounded-lg bg-red-500/10 text-red-500 text-sm"
        >
          {error}
        </motion.div>
      )}

      <div className="space-y-4">
        {/* Username Field */}
        <div className="space-y-1">
          <label htmlFor="username" className="block text-sm font-medium text-gray-200">
            Username <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              id="username"
              type="text"
              value={form.username.value}
              onChange={handleChange('username')}
              className={`
                block w-full pl-10 pr-3 py-2 
                bg-surface-dark border rounded-lg
                ${form.username.error ? 'border-red-500' : 'border-gray-600'}
                text-white placeholder-gray-400
                focus:outline-none focus:ring-2 focus:ring-game-500
              `}
              placeholder="Choose your username"
            />
          </div>
          {form.username.error && (
            <p className="mt-1 text-sm text-red-500">{form.username.error}</p>
          )}
        </div>

        {/* Email Field */}
        <div className="space-y-1">
          <label htmlFor="email" className="block text-sm font-medium text-gray-200">
            Email <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              id="email"
              type="email"
              value={form.email.value}
              onChange={handleChange('email')}
              className={`
                block w-full pl-10 pr-3 py-2 
                bg-surface-dark border rounded-lg
                ${form.email.error ? 'border-red-500' : 'border-gray-600'}
                text-white placeholder-gray-400
                focus:outline-none focus:ring-2 focus:ring-game-500
              `}
              placeholder="Enter your email"
            />
          </div>
          {form.email.error && (
            <p className="mt-1 text-sm text-red-500">{form.email.error}</p>
          )}
        </div>

        {/* Password Field */}
        <div className="space-y-1">
          <label htmlFor="password" className="block text-sm font-medium text-gray-200">
            Password <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              id="password"
              type="password"
              value={form.password.value}
              onChange={handleChange('password')}
              className={`
                block w-full pl-10 pr-3 py-2 
                bg-surface-dark border rounded-lg
                ${form.password.error ? 'border-red-500' : 'border-gray-600'}
                text-white placeholder-gray-400
                focus:outline-none focus:ring-2 focus:ring-game-500
              `}
              placeholder="Create a strong password"
            />
          </div>
          {form.password.error && (
            <p className="mt-1 text-sm text-red-500">{form.password.error}</p>
          )}
        </div>

        {/* Optional Information */}
        <div className="pt-6 border-t border-gray-700">
          <h3 className="text-sm font-medium text-gray-400 mb-4">Optional Information</h3>
          
          <div className="grid grid-cols-2 gap-4">
            {/* First Name Field */}
            <div className="space-y-1">
              <label htmlFor="first_name" className="block text-sm font-medium text-gray-200">
                First Name
              </label>
              <div className="relative">
                <UserCircle className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  id="first_name"
                  type="text"
                  value={form.first_name.value}
                  onChange={handleChange('first_name')}
                  className="block w-full pl-10 pr-3 py-2 bg-surface-dark border border-gray-600 
                           rounded-lg text-white placeholder-gray-400
                           focus:outline-none focus:ring-2 focus:ring-game-500"
                  placeholder="First name"
                />
              </div>
            </div>

            {/* Last Name Field */}
            <div className="space-y-1">
              <label htmlFor="last_name" className="block text-sm font-medium text-gray-200">
                Last Name
              </label>
              <div className="relative">
                <UserCircle className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  id="last_name"
                  type="text"
                  value={form.last_name.value}
                  onChange={handleChange('last_name')}
                  className="block w-full pl-10 pr-3 py-2 bg-surface-dark border border-gray-600 
                           rounded-lg text-white placeholder-gray-400
                           focus:outline-none focus:ring-2 focus:ring-game-500"
                  placeholder="Last name"
                />
              </div>
            </div>
          </div>

          {/* Phone Number Field */}
          <div className="space-y-1 mt-4">
            <label htmlFor="phone_number" className="block text-sm font-medium text-gray-200">
              Phone Number
            </label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                id="phone_number"
                type="tel"
                value={form.phone_number.value}
                onChange={handleChange('phone_number')}
                className="block w-full pl-10 pr-3 py-2 bg-surface-dark border border-gray-600 
                         rounded-lg text-white placeholder-gray-400
                         focus:outline-none focus:ring-2 focus:ring-game-500"
                placeholder="Phone number"
              />
            </div>
          </div>
        </div>
      </div>

      <Button
        type="submit"
        disabled={!isFormValid || isLoading}
        className="w-full"
        variant="primary"
        isLoading={isLoading}
      >
        {isLoading ? 'Creating Account...' : 'Create Account'}
      </Button>
    </form>
  );
};