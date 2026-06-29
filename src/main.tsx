import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

import { validateEnvironment } from './config/environment';
import { errorMonitor } from './services/errorMonitor.service';

validateEnvironment();

window.addEventListener('error', (event) => {
  errorMonitor.logRuntimeError(event.error || new Error(event.message));
});

window.addEventListener('unhandledrejection', (event) => {
  errorMonitor.logRuntimeError(new Error(`Unhandled Promise Rejection: ${event.reason}`));
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
