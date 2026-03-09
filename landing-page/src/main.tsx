import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'
import ErrorBoundary from './components/shared/ErrorBoundary'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary serviceName="eSTAR AI Platform" onRetry={() => window.location.reload()}>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)
