import { ReactNode } from 'react';

interface ToastProps {
  message: string;
  type?: 'success' | 'error' | 'info' | 'warning';
}

// Placeholder implementation until we implement full notification system
export function Toaster() {
  return <div id="toaster-root" className="fixed top-4 right-4 z-50" />;
}

// We'll implement the full toast system when needed
export const toast = {
  success: (message: string) => console.log('Success:', message),
  error: (message: string) => console.log('Error:', message),
  info: (message: string) => console.log('Info:', message),
  warning: (message: string) => console.log('Warning:', message),
};