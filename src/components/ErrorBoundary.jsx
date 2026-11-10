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
      <main
        role="alert"
        style={{
          minHeight: '100vh',
          padding: '2rem',
          boxSizing: 'border-box',
          background: '#0e0e0e',
          color: '#fff',
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        <h1>We couldn't open World Radio App</h1>
        <p>Try reloading the app. Your saved favorites have not been deleted.</p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          style={{
            padding: '0.75rem 1rem',
            border: '2px solid #fff',
            borderRadius: '0.5rem',
            background: '#fff',
            color: '#111',
            font: 'inherit',
            cursor: 'pointer',
          }}
        >
          Reload app
        </button>
      </main>
    );
  }
}
