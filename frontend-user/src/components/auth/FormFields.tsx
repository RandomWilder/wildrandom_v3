// src/components/auth/FormFields.tsx

import { motion, AnimatePresence } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';

export interface ValidationState {
    valid: boolean;
    message: string | null;
    touched: boolean;  
}
 
interface FormFieldProps {
    label: string;
    name: string;
    type: string;
    icon: LucideIcon;
    value: string;
    onChange: (value: string) => void;
    validation: ValidationState;
    required?: boolean;
    placeholder?: string;
  }
  

  export const FormField: React.FC<FormFieldProps> = ({
    label,
    name,
    type,
    icon: Icon,
    value,
    onChange,
    validation,
    required = false,
    placeholder
  }) => {
  
  const getValidationColor = () => {
    if (!validation.touched) return 'border-gray-600';
    return validation.valid ? 'border-green-500' : 'border-red-500';
  };

  return (
    <div className="space-y-1">
      <label 
        htmlFor={name}
        className="block text-sm font-medium text-gray-300"
      >
        {label}
        {required && (
          <span className="text-game-500 ml-1" aria-hidden="true">*</span>
        )}
      </label>

      <div className="relative">
        <Icon 
          className={`absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 
            ${validation.touched 
              ? (validation.valid ? 'text-green-500' : 'text-red-500')
              : 'text-gray-400'
            }`}
        />
        
        <input
          id={name}
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`
            block w-full pl-10 pr-3 py-2 
            bg-surface-dark 
            border ${getValidationColor()} 
            rounded-lg text-white 
            transition-colors duration-200
            focus:ring-2 focus:ring-game-500 
            placeholder-gray-400
          `}
          placeholder={placeholder}
        />

        {validation.touched && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`absolute right-2 top-1/2 transform -translate-y-1/2
              ${validation.valid ? 'text-green-500' : 'text-red-500'}`}
          >
            {validation.valid && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="flex items-center"
              >
                <span className="mr-2 text-xs font-medium">+100</span>
                <svg 
                  className="w-5 h-5" 
                  fill="currentColor" 
                  viewBox="0 0 20 20"
                >
                  <path 
                    fillRule="evenodd" 
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" 
                    clipRule="evenodd" 
                  />
                </svg>
              </motion.div>
            )}
          </motion.div>
        )}
      </div>

      <AnimatePresence>
        {validation.touched && validation.message && (
          <motion.p
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className={`text-xs ${
              validation.valid ? 'text-green-500' : 'text-red-500'
            }`}
          >
            {validation.message}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
};