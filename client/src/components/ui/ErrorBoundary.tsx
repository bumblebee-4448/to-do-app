import React, { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode | ((error: Error, reset: () => void) => ReactNode);
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public override state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public override componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  public override render() {
    if (this.state.hasError && this.state.error) {
      if (this.props.fallback) {
        if (typeof this.props.fallback === 'function') {
          return this.props.fallback(this.state.error, this.handleReset);
        }
        return this.props.fallback;
      }

      return (
        <div
          role="alert"
          style={{
            padding: '24px',
            borderRadius: '12px',
            border: '1px solid var(--border-danger, #ef4444)',
            background: 'var(--bg-danger-subtle, rgba(239, 68, 68, 0.05))',
            color: 'var(--text-danger, #ef4444)',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            margin: '16px 0',
          }}
        >
          <div style={{ fontWeight: 600, fontSize: '15px' }}>
            Đã xảy ra sự cố hiển thị ở vùng này
          </div>
          <div style={{ fontSize: '13px', fontFamily: 'var(--font-mono, monospace)', opacity: 0.9 }}>
            {this.state.error.message}
          </div>
          <button
            onClick={this.handleReset}
            className="btn btn--secondary"
            style={{
              alignSelf: 'flex-start',
              height: '32px',
              padding: '0 12px',
              fontSize: '12px',
              borderColor: 'var(--border-danger, #ef4444)',
              color: 'var(--text-danger, #ef4444)',
            }}
          >
            Thử lại
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
