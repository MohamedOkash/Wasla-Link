import { useTranslation } from '../../hooks/useTranslation';
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCcw, Home } from 'lucide-react';
import { errorMonitor } from '../../services/errorMonitor.service';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error in React Tree:', error, errorInfo);
    // Extract metadata
    const metadata = {
      componentStack: errorInfo.componentStack,
      userAgent: navigator.userAgent
    };
    errorMonitor.logRuntimeError(error, undefined, undefined, metadata);
  }

  private handleRecover = () => {
    this.setState({ hasError: false, error: null });
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      return (
        <div className="flex flex-col items-center justify-center h-full min-h-[400px] p-5 bg-theme-bg text-theme-text font-sans">
          <AlertTriangle size={64} className="text-red-500 mb-4" />
          <h2 className="text-xl font-black mb-2 text-center">Unexpected Error</h2>
          <p className="text-theme-muted text-sm text-center mb-6 max-w-sm whitespace-pre-wrap break-words">
            {this.state.error?.message || 'لقد واجهنا مشكلة أثناء عرض هذه الصفحة. يرجى المحاولة مرة أخرى.'}
          </p>
          <div className="flex gap-4">
            <button
              onClick={() => window.location.reload()}
              className="flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-primary/20 hover:scale-105 transition"
            >
              <RefreshCcw size={18} />Reload</button>
            <button
              onClick={this.handleRecover}
              className="flex items-center gap-2 bg-theme-card border border-theme-border text-theme-text px-6 py-3 rounded-xl font-bold hover:scale-105 transition"
            >
              <Home size={18} />Go to Home</button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
