import React from 'react';
import * as Sentry from '@sentry/react';

/**
 * Botón para testear Sentry en desarrollo
 * Solo visible en modo dev
 */
function SentryTestButton() {
  // Solo mostrar en desarrollo
  if (import.meta.env.PROD) return null;

  return (
    <button
      onClick={() => {
        // Capturar error en Sentry
        Sentry.captureException(new Error('🧪 Test error from Sentry Test Button'));
        
        // También lanzar error para ver en consola
        throw new Error('🧪 This is a test Sentry error!');
      }}
      className="fixed bottom-4 right-4 z-50 px-4 py-2 bg-red-600 text-white rounded-lg shadow-lg hover:bg-red-700 transition-all text-sm font-semibold"
      title="Test Sentry Error Tracking"
    >
      🐛 Test Sentry
    </button>
  );
}

export default SentryTestButton;
