import { Component, ReactNode } from "react";

interface ErrorBoundaryProps {
  children: ReactNode;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps> {
  render() {
    return this.props.children;
  }
}
