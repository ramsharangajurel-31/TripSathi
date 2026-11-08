import { Component } from "react";
import ErrorState from "./ErrorState";

/**
 * Catches errors thrown while rendering any child component, so one broken
 * page shows a friendly message instead of a blank white screen.
 *
 * Props
 *  resetKey   when this value changes (e.g. the current URL path) the error
 *             is cleared, so navigating away from a broken page recovers
 *  children   the part of the app to protect
 *
 * Note: error boundaries must be class components. They do not catch errors
 * in event handlers or async code; handle those with try/catch and toasts.
 */
export default class ErrorBoundary extends Component {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    // In the backend phase this is the place to report to a logging service.
    console.error("TripSathi render error:", error, info?.componentStack);
  }

  componentDidUpdate(previousProps) {
    if (this.state.hasError && previousProps.resetKey !== this.props.resetKey) {
      this.setState({ hasError: false });
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="container section">
          <ErrorState
            title="This page ran into a problem"
            message="Something unexpected happened while showing this page. You can try again or go back to the home page."
            onRetry={this.handleRetry}
            secondaryLabel="Go to home"
            secondaryTo="/"
          />
        </div>
      );
    }

    return this.props.children;
  }
}