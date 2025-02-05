// File: /src/components/common/ErrorBoundary/FeatureErrorBoundary.tsx

import React, { Component, ErrorInfo, PropsWithChildren } from 'react';
import { AlertTriangle } from 'lucide-react';
import Card from '../Card';
import Button from '../Button';

interface FeatureErrorBoundaryProps extends PropsWithChildren {
  feature: string;
  fallback?: React.ReactNode;
  onReset?: () => void;
}

interface FeatureErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class FeatureErrorBoundary extends Component<FeatureErrorBoundaryProps, FeatureErrorBoundaryState> {
  constructor(props: FeatureErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): FeatureErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log the error to your error reporting service
    console.error(`Error in ${this.props.feature}:`, error, errorInfo);
  }

  handleReset = (): void => {
    this.setState({ hasError: false, error: null });
    this.props.onReset?.();
  };

  render(): React.ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <Card variant="default" className="p-4">
          <div className="flex flex-col items-center space-y-4 text-center">
            <AlertTriangle className="w-8 h-8 text-orange-500" />
            <div>
              <h3 className="font-semibold text-gray-900">
                {this.props.feature} is currently unavailable
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                We're having trouble loading this feature
              </p>
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={this.handleReset}
            >
              Try Again
            </Button>
          </div>
        </Card>
      );
    }

    return this.props.children;
  }
}