import React from 'react';
import logger from '../utils/logger';

/**
 * ErrorBoundary — catches React render errors anywhere in the component tree.
 *
 * Renders a premium full-page fallback UI instead of a blank white screen.
 * Logs the error via the shared logger so it shows up in console output.
 *
 * Usage: wrap your root app (done in main.jsx) — you rarely need this elsewhere.
 */

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, eventId: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    logger.error('React render error caught by ErrorBoundary', {
      message: error.message,
      componentStack: info?.componentStack,
    });

    try {
      const API_URL = window.location.origin.includes('5173')
        ? 'http://localhost:5001'
        : window.location.origin;

      fetch(`${API_URL}/api/logs/client`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          error: {
            message: error.message,
            stack: error.stack
          },
          info: {
            componentStack: info?.componentStack
          }
        })
      }).catch(() => {});
    } catch (e) {}
  }

  handleReload = () => {
    window.location.reload();
  };

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    const { error } = this.state;
    const isDark = document.documentElement.classList.contains('dark');

    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: isDark
            ? 'linear-gradient(135deg, #0f1117 0%, #1a1d2e 50%, #0f1117 100%)'
            : 'linear-gradient(135deg, #f0f4ff 0%, #e8eeff 50%, #f0f4ff 100%)',
          fontFamily: "'Inter', 'Segoe UI', sans-serif",
          padding: '2rem',
        }}
      >
        <div
          style={{
            maxWidth: '520px',
            width: '100%',
            background: isDark
              ? 'rgba(255,255,255,0.04)'
              : 'rgba(255,255,255,0.85)',
            border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(99,102,241,0.15)'}`,
            borderRadius: '20px',
            padding: '3rem 2.5rem',
            backdropFilter: 'blur(20px)',
            boxShadow: isDark
              ? '0 25px 60px rgba(0,0,0,0.5)'
              : '0 25px 60px rgba(99,102,241,0.12)',
            textAlign: 'center',
          }}
        >
          {/* Icon */}
          <div style={{ fontSize: '3.5rem', marginBottom: '1.25rem' }}>⚠️</div>

          {/* Title */}
          <h1
            style={{
              fontSize: '1.5rem',
              fontWeight: 700,
              color: isDark ? '#e2e8f0' : '#1e293b',
              margin: '0 0 0.75rem',
            }}
          >
            Something went wrong
          </h1>

          {/* Subtitle */}
          <p
            style={{
              fontSize: '0.95rem',
              color: isDark ? '#94a3b8' : '#64748b',
              margin: '0 0 1.5rem',
              lineHeight: 1.6,
            }}
          >
            PrepHQ hit an unexpected error. Your data is safe — this is a display issue only.
          </p>

          {/* Error detail (dev only) */}
          {import.meta.env.DEV && error?.message && (
            <pre
              style={{
                background: isDark ? 'rgba(239,68,68,0.1)' : 'rgba(239,68,68,0.06)',
                border: '1px solid rgba(239,68,68,0.25)',
                borderRadius: '10px',
                padding: '1rem',
                fontSize: '0.78rem',
                color: '#ef4444',
                textAlign: 'left',
                overflowX: 'auto',
                marginBottom: '1.75rem',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-all',
              }}
            >
              {error.message}
            </pre>
          )}

          {/* Actions */}
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
            <button
              onClick={this.handleReset}
              style={{
                padding: '0.65rem 1.5rem',
                borderRadius: '10px',
                border: `1px solid ${isDark ? 'rgba(255,255,255,0.12)' : 'rgba(99,102,241,0.3)'}`,
                background: 'transparent',
                color: isDark ? '#94a3b8' : '#6366f1',
                fontSize: '0.9rem',
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              Try again
            </button>
            <button
              onClick={this.handleReload}
              style={{
                padding: '0.65rem 1.5rem',
                borderRadius: '10px',
                border: 'none',
                background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                color: '#fff',
                fontSize: '0.9rem',
                fontWeight: 600,
                cursor: 'pointer',
                boxShadow: '0 4px 15px rgba(99,102,241,0.35)',
                transition: 'all 0.2s',
              }}
            >
              Reload app
            </button>
          </div>
        </div>
      </div>
    );
  }
}

export default ErrorBoundary;
