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
        <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'var(--void)' }}>
          <div className="w-full max-w-sm rounded-2xl p-8 text-center" style={{ background: 'var(--surface-raised)', border: '1px solid var(--border-strong)' }}>
            <div className="w-14 h-14 mx-auto mb-5 rounded-full flex items-center justify-center" style={{ background: 'rgba(212,106,106,0.1)', border: '1px solid rgba(212,106,106,0.2)' }}>
              <svg className="w-7 h-7" style={{ color: 'var(--danger)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h1 className="text-xl font-medium mb-2" style={{ color: 'var(--text)', fontFamily: 'var(--font-serif)' }}>Something went wrong</h1>
            <p className="text-sm mb-6" style={{ color: 'var(--text-muted)' }}>
              {this.state.error?.message || 'An unexpected error occurred'}
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={this.handleReset}
                className="px-5 py-2.5 text-sm font-medium rounded-xl transition-colors"
                style={{ color: 'var(--text-muted)', border: '1px solid var(--border-strong)' }}
              >
                Try again
              </button>
              <button
                onClick={this.handleReload}
                className="px-5 py-2.5 text-sm font-medium rounded-xl transition-all active:scale-[0.98]"
                style={{ background: 'var(--gold)', color: 'var(--void)' }}
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
