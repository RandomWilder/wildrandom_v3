// File: /src/components/common/ErrorBoundary/GlobalErrorBoundary.tsx

import React, { Component, ErrorInfo, PropsWithChildren } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import Card from '../Card';
import Button from '../Button';

interface ErrorBoundaryState {
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class GlobalErrorBoundary extends Component<PropsWithChildren, ErrorBoundaryState> {
  constructor(props: PropsWithChildren) {
    super(props);
    this.state = { error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error, errorInfo: null };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.setState({
      error,
      errorInfo
    });

    // Here we could send error reports to a service like Sentry
    console.error('Uncaught error:', error, errorInfo);
  }

  handleReset = (): void => {
    this.setState({ error: null, errorInfo: null });
    window.location.href = '/';
  };

  render(): React.ReactNode {
    if (this.state.error) {
      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
          <Card variant="default" className="w-full max-w-lg">
            <div className="p-6 space-y-6">
              <div className="flex items-center space-x-4">
                <AlertTriangle className="w-10 h-10 text-red-500" />
                <div>
                  <h1 className="text-xl font-semibold text-gray-900">
                    Oops! Something went wrong
                  </h1>
                  <p className="mt-1 text-sm text-gray-500">
                    We've encountered an unexpected error
                  </p>
                </div>
              </div>

              <div className="p-4 bg-red-50 rounded-lg border border-red-100">
                <p className="text-sm font-mono text-red-600 break-all">
                  {this.state.error.toString()}
                </p>
              </div>

              <div className="flex space-x-4">
                <Button
                  onClick={this.handleReset}
                  variant="primary"
                  className="flex items-center"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Reset Application
                </Button>
                <Button
                  onClick={() => window.location.reload()}
                  variant="secondary"
                >
                  Reload Page
                </Button>
              </div>

              {process.env.NODE_ENV === 'development' && this.state.errorInfo && (
                <div className="mt-4">
                  <details className="cursor-pointer">
                    <summary className="text-sm text-gray-600 hover:text-gray-900">
                      Technical Details
                    </summary>
                    <pre className="mt-2 p-4 bg-gray-800 text-gray-200 rounded-lg overflow-auto text-xs">
                      {this.state.errorInfo.componentStack}
                    </pre>
                  </details>
                </div>
              )}
            </div>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}