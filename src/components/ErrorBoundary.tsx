import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  handleReload = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'var(--gradient-bg)' }}>
          <div className="w-full max-w-md text-center">
            <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-error/10 border border-error/20 flex items-center justify-center" style={{ boxShadow: '0 0 20px rgba(248, 113, 113, 0.2)' }}>
              <svg className="w-8 h-8 text-error" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gradient mb-2" style={{ fontFamily: 'var(--font-serif)' }}>Something went wrong</h1>
            <p className="text-text-muted mb-6">
              {this.state.error?.message || 'An unexpected error occurred'}
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={this.handleReset}
                className="px-6 py-3 text-sm font-medium text-text-muted hover:text-primary glass-light border border-hairline rounded-xl hover:border-primary/30 transition-smooth"
              >
                Try again
              </button>
              <button
                onClick={this.handleReload}
                className="px-6 py-3 text-sm font-medium text-[#0A0D16] bg-primary-gradient rounded-xl transition-smooth shadow-glow hover:shadow-[0_0_20px_rgba(201,162,75,0.3)]"
              >
                Reload page
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
