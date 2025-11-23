import { Component, ReactNode } from "react";
import { logError } from "@/lib/errorLogger";
import { Button } from "@/components/ui/button";
import { AlertTriangle, ChevronDown, ChevronUp } from "lucide-react";

interface ErrorBoundaryProps {
  children: ReactNode;
  showDetails?: boolean;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
  showDetails: boolean;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = {
    hasError: false,
    error: null,
    errorInfo: null,
    showDetails: false,
  };

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    logError(error, errorInfo);
    this.setState({
      hasError: true,
      error,
      errorInfo,
    });
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      showDetails: false,
    });
  };

  toggleDetails = () => {
    this.setState((prev) => ({ showDetails: !prev.showDetails }));
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-background">
          <div className="max-w-md w-full text-center">
            <div className="flex justify-center mb-4">
              <AlertTriangle className="h-16 w-16 text-destructive" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-3">
              Something went wrong
            </h1>
            <p className="text-muted-foreground mb-6">
              The application encountered an unexpected error. This has been logged for review.
            </p>

            <div className="bg-muted/50 p-4 rounded-lg border mb-6">
              <p className="text-sm font-mono text-left break-words text-destructive">
                {this.state.error?.message || "Unknown error"}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button onClick={this.handleReset} variant="default">
                Try Again
              </Button>
              <Button
                onClick={() => window.location.href = "/"}
                variant="outline"
              >
                Reload Page
              </Button>
            </div>

            <p className="text-xs text-muted-foreground mt-6">
              Error details have been saved to your browser's console
            </p>

            {(this.state.error?.stack || this.state.errorInfo?.componentStack) && (
              <div className="mt-4">
                <Button
                  onClick={this.toggleDetails}
                  variant="ghost"
                  size="sm"
                  className="text-xs"
                >
                  {this.state.showDetails ? (
                    <>
                      <ChevronUp className="h-3 w-3 mr-1" />
                      Hide Details
                    </>
                  ) : (
                    <>
                      <ChevronDown className="h-3 w-3 mr-1" />
                      Show Details
                    </>
                  )}
                </Button>

                {this.state.showDetails && (
                  <div className="mt-3 bg-muted p-3 rounded border text-left max-h-48 overflow-auto">
                    {this.state.error?.stack && (
                      <div className="mb-3">
                        <p className="text-xs font-semibold mb-1">Stack Trace:</p>
                        <pre className="text-xs font-mono whitespace-pre-wrap break-words">
                          {this.state.error.stack}
                        </pre>
                      </div>
                    )}
                    {this.state.errorInfo?.componentStack && (
                      <div>
                        <p className="text-xs font-semibold mb-1">Component Stack:</p>
                        <pre className="text-xs font-mono whitespace-pre-wrap break-words">
                          {this.state.errorInfo.componentStack}
                        </pre>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
