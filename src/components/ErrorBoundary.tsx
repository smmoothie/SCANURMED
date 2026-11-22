import React, { Component, ErrorInfo, ReactNode } from 'react';
import { ShieldAlert, RotateCcw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  message: string;
}

export class ErrorBoundary extends Component<Props, State> {
  declare readonly props: Props;
  public state: State = {
    hasError: false,
    message: '',
  };

  public static getDerivedStateFromError(error: Error): State {
    let displayMessage = 'An unexpected error occurred while processing your request.';
    try {
      const parsed = JSON.parse(error.message);
      if (parsed && typeof parsed.error === 'string') {
        displayMessage = parsed.error.includes('Missing or insufficient permissions')
          ? 'Database access was denied for this operation. Please sign in with an authorized account.'
          : parsed.error;
      }
    } catch {
      if (error.message) {
        displayMessage = error.message;
      }
    }
    return { hasError: true, message: displayMessage };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Application ErrorBoundary caught:', error, errorInfo);
  }

  private handleReset = () => {
    window.location.href = '/';
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#F7FAFC] flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-white border border-[#054A8C] rounded-2xl p-8 text-center space-y-6">
            <div className="w-14 h-14 mx-auto rounded-xl bg-[#7BBCE5]/20 border border-[#054A8C] flex items-center justify-center text-[#FA6806]">
              <ShieldAlert size={28} />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-[#054A8C]">Application Notice</h2>
              <p className="text-sm text-[#334E68] leading-relaxed">{this.state.message}</p>
            </div>
            <button
              onClick={this.handleReset}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[#FA6806] text-white font-semibold hover:bg-[#E05A00] transition-colors whitespace-nowrap"
            >
              <RotateCcw size={16} />
              <span>Return Home</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
