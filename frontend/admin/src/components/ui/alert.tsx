// frontend/admin/src/components/ui/alert.tsx

import React from 'react';

interface AlertProps {
  children: React.ReactNode;
  variant?: 'default' | 'destructive';
  className?: string;
}

const Alert = React.forwardRef<HTMLDivElement, AlertProps>(
  ({ children, variant = 'default', className = '' }, ref) => (
    <div
      ref={ref}
      role="alert"
      className={`
        relative w-full rounded-lg border p-4
        ${variant === 'destructive' ? 'border-red-500/50 text-red-700 bg-red-50' : 'bg-white border-gray-200'}
        ${className}
      `}
    >
      {children}
    </div>
  )
);
Alert.displayName = "Alert";

const AlertTitle = React.forwardRef<HTMLHeadingElement, React.HTMLProps<HTMLHeadingElement>>(
  ({ children, className = '', ...props }, ref) => (
    <h5
      ref={ref}
      className={`mb-1 font-medium leading-none tracking-tight ${className}`}
      {...props}
    >
      {children}
    </h5>
  )
);
AlertTitle.displayName = "AlertTitle";

const AlertDescription = React.forwardRef<HTMLDivElement, React.HTMLProps<HTMLDivElement>>(
  ({ children, className = '', ...props }, ref) => (
    <div
      ref={ref}
      className={`text-sm ${className}`}
      {...props}
    >
      {children}
    </div>
  )
);
AlertDescription.displayName = "AlertDescription";

export { Alert, AlertTitle, AlertDescription };