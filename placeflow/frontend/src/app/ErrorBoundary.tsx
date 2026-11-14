/**
 * PlaceFlow / Meridian — Error Boundary Component.
 * Class component that catches rendering errors in children, logs to console,
 * and displays an accessible ErrorState with a copyable error ID and reload action.
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { ErrorState } from '../ui/ErrorState';

export interface ErrorBoundaryProps {
  children?: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorId: string | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public override state: ErrorBoundaryState = {
    hasError: false,
    error: null,
    errorId: null,
  };

  public static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    const randomHex = Math.random().toString(36).substring(2, 8).toUpperCase();
    const errorId = `ERR-${Date.now().toString(36).toUpperCase()}-${randomHex}`;
    return {
      hasError: true,
      error,
      errorId,
    };
  }

  public override componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('[Meridian ErrorBoundary] Caught render failure:', error, errorInfo);
  }

  private handleReload = (): void => {
    window.location.reload();
  };

  public override render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="w-full min-h-[300px] flex items-center justify-center p-6">
          <ErrorState
            title="Something went wrong on this page"
            message={
              this.state.error?.message ||
              'An unexpected rendering error occurred. Please reload the page or contact system administration.'
            }
            errorId={this.state.errorId || undefined}
            onReload={this.handleReload}
          />
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Route-level fallback element for React Router route configs.
 */
export const RouteErrorElement: React.FC = () => {
  const errorId = `ERR-ROUTE-${Date.now().toString(36).toUpperCase()}`;

  return (
    <div className="w-full min-h-[300px] flex items-center justify-center p-6">
      <ErrorState
        title="Something went wrong on this page"
        message="An unexpected error occurred while loading this route."
        errorId={errorId}
        onReload={() => window.location.reload()}
      />
    </div>
  );
};

