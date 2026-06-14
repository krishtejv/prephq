import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';
import { PrepProvider } from './context/PrepContext.jsx';
import ErrorBoundary from './components/ErrorBoundary.jsx';
import logger from './utils/logger.js';

// Global handler for unhandled async promise rejections (e.g. fire-and-forget fetches)
window.addEventListener('unhandledrejection', (event) => {
  logger.error('Unhandled promise rejection', {
    reason: event.reason?.message ?? String(event.reason),
    stack: event.reason?.stack,
  });
});

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <PrepProvider>
        <App />
      </PrepProvider>
    </ErrorBoundary>
  </StrictMode>,
);
