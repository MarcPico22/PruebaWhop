import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import * as Sentry from "@sentry/react";
import { AuthProvider } from './AuthContext.jsx'
import { ThemeProvider } from './ThemeContext.jsx'
import './i18n' // Import i18n configuration
import LandingPage from './LandingPage.jsx'
import Login from './Login.jsx'
import Signup from './Signup.jsx'
import Dashboard from './Dashboard.jsx'
import Pricing from './Pricing.jsx'
import FAQ from './FAQ.jsx'
import Terminos from './Terminos.jsx'
import Privacidad from './Privacidad.jsx'
import './index.css'

// Sentry Setup - SIEMPRE activo (dev y prod)
const sentryDSN = import.meta.env.VITE_SENTRY_DSN || "https://510e483f358575a0f56467f9fb085910@o4510290182864896.ingest.de.sentry.io/4510290200363088";

Sentry.init({
  dsn: sentryDSN,
  integrations: [
    Sentry.browserTracingIntegration(),
    Sentry.replayIntegration({
      maskAllText: false,
      blockAllMedia: false,
    }),
  ],
  // Performance Monitoring
  tracesSampleRate: import.meta.env.PROD ? 0.1 : 1.0, // 100% en dev, 10% en prod
  // Session Replay
  replaysSessionSampleRate: 0.1, // 10% de sesiones normales
  replaysOnErrorSampleRate: 1.0, // 100% de sesiones con errores
  environment: import.meta.env.MODE,
  sendDefaultPii: true, // Enviar IP para mejor tracking
});

console.log('✅ Sentry initialized', { 
  environment: import.meta.env.MODE,
  dsn: sentryDSN.substring(0, 50) + '...'
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Signup />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/pricing" element={<Pricing />} />
            <Route path="/faq" element={<FAQ />} />
            <Route path="/terminos" element={<Terminos />} />
            <Route path="/privacidad" element={<Privacidad />} />
            <Route path="/terms" element={<Terminos />} />
            <Route path="/privacy" element={<Privacidad />} />
          </Routes>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  </React.StrictMode>,
)
