import { Component } from 'react';

export default class ErrorBoundary extends Component {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (!this.state.hasError) return this.props.children;
    if (this.props.fallback) return this.props.fallback;

    // This must work even when a provider or the theme has failed to initialize.
    return (
      <main role="alert" className="fatal-error">
        <h1>We couldn't open World Radio App</h1>
        <p>Try reloading the app. Your saved favorites have not been deleted.</p>
        <button type="button" onClick={() => window.location.reload()}>
          Reload app
        </button>
      </main>
    );
  }
}
