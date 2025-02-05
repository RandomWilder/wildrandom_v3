import { InputHTMLAttributes, forwardRef } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { CheckCircle, XCircle, AlertCircle } from 'lucide-react';

// Enhanced input variants with sophisticated validation states
const inputVariants = cva(
  "block w-full rounded-md shadow-sm transition-colors duration-200 ease-in-out",
  {
    variants: {
      size: {
        sm: "text-sm px-3 py-2",
        md: "text-base px-4 py-2",
        lg: "text-lg px-4 py-3",
      },
      state: {
        default: "border-gray-300 focus:border-indigo-500 focus:ring-indigo-500",
        error: "border-red-500 focus:border-red-500 focus:ring-red-500 bg-red-50",
        success: "border-green-500 focus:border-green-500 focus:ring-green-500 bg-green-50",
        validating: "border-yellow-500 focus:border-yellow-500 focus:ring-yellow-500 bg-yellow-50",
      }
    },
    defaultVariants: {
      size: "md",
      state: "default",
    }
  }
);

// Wrapper variants for consistent container styling
const wrapperVariants = cva("relative", {
  variants: {
    size: {
      sm: "text-sm",
      md: "text-base",
      lg: "text-lg",
    }
  },
  defaultVariants: {
    size: "md"
  }
});

interface InputProps 
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'>,
    VariantProps<typeof inputVariants> {
  label?: string;
  error?: string;
  hint?: string;
  showValidationIcon?: boolean;
}

const Input = forwardRef<HTMLInputElement, InputProps>(({
  label,
  error,
  hint,
  size,
  state = error ? "error" : "default",
  className = "",
  disabled,
  showValidationIcon = true,
  ...props
}, ref) => {
  // Determine validation icon based on state
  const ValidationIcon = state === 'success' ? CheckCircle : 
                        state === 'error' ? XCircle :
                        state === 'validating' ? AlertCircle : 
                        null;

  const iconColors = {
    success: "text-green-500",
    error: "text-red-500",
    validating: "text-yellow-500"
  };

  return (
    <div className={wrapperVariants({ size })}>
      {label && (
        <label 
          htmlFor={props.id} 
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          {label}
        </label>
      )}
      <div className="relative">
        <input
          ref={ref}
          className={`${inputVariants({ size, state, className })} ${
            showValidationIcon && ValidationIcon ? 'pr-10' : ''
          }`}
          disabled={disabled}
          {...props}
        />
        {showValidationIcon && ValidationIcon && (
          <div className="absolute inset-y-0 right-0 flex items-center pr-3">
            <ValidationIcon 
              className={`h-5 w-5 ${iconColors[state as keyof typeof iconColors] || ''} ${
                state === 'validating' ? 'animate-pulse' : ''
              }`}
            />
          </div>
        )}
      </div>
      {(error || hint) && (
        <p 
          className={`mt-1 text-sm ${
            error ? "text-red-600" : "text-gray-500"
          }`}
        >
          {error || hint}
        </p>
      )}
    </div>
  );
});

Input.displayName = "Input";

export default Input;