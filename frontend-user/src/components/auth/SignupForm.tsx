// src/components/auth/SignupForm.tsx

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { User, Mail, Lock, UserCircle, Phone } from 'lucide-react';
import { FormField } from './FormFields';
import { RegistrationProgress } from './RegistrationProgress';
import type { 
  RegistrationStep,
  RegistrationCredentials,
  FormValidationState,
  FieldValidation
} from '@/types/auth';

interface SignupFormProps {
  onSubmit: (data: RegistrationCredentials) => Promise<void>;
  isLoading?: boolean;
  error?: string;
}

const initialFormData: RegistrationCredentials = {
  username: '',
  email: '',
  password: '',
  first_name: '',
  last_name: '',
  phone_number: ''
};

const createValidationState = (isValid: boolean = true): FieldValidation => ({
  valid: isValid,
  message: null,
  touched: false
});

const initialValidation: FormValidationState = {
  username: createValidationState(false),
  email: createValidationState(false),
  password: createValidationState(false),
  first_name: createValidationState(),
  last_name: createValidationState(),
  phone_number: createValidationState()
};

export const SignupForm: React.FC<SignupFormProps> = ({
  onSubmit,
  isLoading = false,
  error
}) => {
  const [currentStep, setCurrentStep] = useState<RegistrationStep>('initial');
  const [formData, setFormData] = useState<RegistrationCredentials>(initialFormData);
  const [validation, setValidation] = useState<FormValidationState>(initialValidation);
  const [passwordStrength, setPasswordStrength] = useState(0);

  const validateUsername = (value: string): FieldValidation => {
    if (!value) return { valid: false, message: 'Required to start your journey', touched: true };
    if (value.length < 3) return { valid: false, message: `${3 - value.length} more characters needed`, touched: true };
    if (value.length > 64) return { valid: false, message: 'Username too powerful! Max 64 characters', touched: true };
    if (!/^[a-zA-Z0-9_-]*$/.test(value)) return { valid: false, message: 'Only letters, numbers, _ and - allowed', touched: true };
    return { valid: true, message: 'Username looks great!', touched: true };
  };

  const calculatePasswordStrength = (password: string): number => {
    let score = 0;
    if (password.length >= 8) score += 25;
    if (/[A-Z]/.test(password)) score += 25;
    if (/[a-z]/.test(password)) score += 25;
    if (/[0-9]/.test(password)) score += 15;
    if (/[^A-Za-z0-9]/.test(password)) score += 10;
    return Math.min(100, score);
  };

  const handleFieldChange = (field: keyof RegistrationCredentials) => (value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));

    let fieldValidation: FieldValidation;
    switch (field) {
      case 'username':
        fieldValidation = validateUsername(value);
        break;
      case 'email':
        fieldValidation = {
          valid: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
          message: value ? 'Email looks good!' : 'Required',
          touched: true
        };
        break;
      case 'password':
        const strength = calculatePasswordStrength(value);
        setPasswordStrength(strength);
        fieldValidation = {
          valid: strength >= 80,
          message: strength < 80 ? `Password power: ${strength}%` : 'Password is strong!',
          touched: true
        };
        break;
      default:
        fieldValidation = createValidationState();
    }

    setValidation(prev => ({
      ...prev,
      [field]: fieldValidation
    }));
  };

  const calculateProgress = (): number => {
    const requiredFields: Array<keyof FormValidationState> = ['username', 'email', 'password'];
    const validFields = requiredFields.filter(field => validation[field].valid);
    return (validFields.length / requiredFields.length) * 100;
  };

  useEffect(() => {
    const progress = calculateProgress();
    if (progress === 100 && currentStep === 'form_filling') {
      setCurrentStep('validation');
    } else if (progress > 0 && currentStep === 'initial') {
      setCurrentStep('form_filling');
    }
  }, [validation, currentStep]);

  return (
    <div className="space-y-6">
      <RegistrationProgress
        currentStep={currentStep}
        progress={calculateProgress()}
        error={error}
      />

      <motion.form 
        onSubmit={async (e) => {
          e.preventDefault();
          if (isLoading) return;
          
          setCurrentStep('submission');
          try {
            await onSubmit(formData);
            setCurrentStep('success');
          } catch {
            setCurrentStep('validation');
          }
        }}
        className="space-y-6"
      >
        <div className="space-y-4">
          <FormField
            label="Choose Your Username"
            name="username"
            type="text"
            icon={User}
            value={formData.username}
            onChange={handleFieldChange('username')}
            validation={validation.username}
            required
          />

          <FormField
            label="Email Address"
            name="email"
            type="email"
            icon={Mail}
            value={formData.email}
            onChange={handleFieldChange('email')}
            validation={validation.email}
            required
          />

          <FormField
            label="Create Password"
            name="password"
            type="password"
            icon={Lock}
            value={formData.password}
            onChange={handleFieldChange('password')}
            validation={validation.password}
            required
          />

          {/* Optional Fields Section */}
          <motion.div 
            className="space-y-4 border-t border-gray-700 pt-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: validation.username.valid || validation.email.valid ? 1 : 0.5 }}
          >
            <h4 className="text-sm text-gray-400">Optional Information</h4>
            
            <div className="grid grid-cols-2 gap-4">
              <FormField
                label="First Name"
                name="first_name"
                type="text"
                icon={UserCircle}
                value={formData.first_name}
                onChange={handleFieldChange('first_name')}
                validation={validation.first_name}
              />

              <FormField
                label="Last Name"
                name="last_name"
                type="text"
                icon={UserCircle}
                value={formData.last_name}
                onChange={handleFieldChange('last_name')}
                validation={validation.last_name}
              />
            </div>

            <FormField
              label="Phone Number"
              name="phone_number"
              type="tel"
              icon={Phone}
              value={formData.phone_number}
              onChange={handleFieldChange('phone_number')}
              validation={validation.phone_number}
            />
          </motion.div>
        </div>

        <motion.button
          type="submit"
          disabled={isLoading || !['username', 'email', 'password'].every(
            field => validation[field as keyof FormValidationState].valid
          )}
          className="w-full py-3 px-4 bg-game-500 text-white rounded-lg font-medium 
                   hover:bg-game-600 focus:outline-none focus:ring-2 focus:ring-game-500 
                   disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          {isLoading ? 'Creating Account...' : 'Create Account'}
        </motion.button>
      </motion.form>
    </div>
  );
};