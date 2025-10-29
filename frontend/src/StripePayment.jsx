import React, { useState } from 'react';
import { useAuth } from './AuthContext';
import { API_URL } from './config';

export default function StripePayment({ payment, onClose, onSuccess }) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handlePayment = async () => {
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('${API_URL}/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ paymentId: payment.id })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error creando sesión de pago');
      }

      // Redirigir a Stripe Checkout
      if (data.url) {
        window.location.href = data.url;
      }

    } catch (err) {
      console.error('Error:', err);
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              💳 Procesar pago
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Pago seguro con Stripe
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-2xl"
          >
            ×
          </button>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-xl p-6 mb-6">
          <div className="flex justify-between items-center mb-3">
            <span className="text-gray-700 dark:text-gray-300 font-medium">
              {payment.product}
            </span>
            <span className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              ${payment.amount}
            </span>
          </div>
          
          <div className="flex items-center text-sm text-gray-600 dark:text-gray-400 mb-2">
            <span className="mr-2">📧</span>
            {payment.email}
          </div>
          
          <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
            <span className="mr-2">🔄</span>
            Intentos: {payment.retries}/3
          </div>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg mb-4">
            ❌ {error}
          </div>
        )}

        <div className="space-y-3">
          <button
            onClick={handlePayment}
            disabled={loading}
            className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold py-4 px-6 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Creando sesión de pago...
              </>
            ) : (
              <>
                <span className="mr-2">🔐</span>
                Pagar con Stripe
              </>
            )}
          </button>

          <button
            onClick={onClose}
            className="w-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 font-semibold py-3 px-6 rounded-xl transition-all duration-200"
          >
            Cancelar
          </button>
        </div>

        <div className="mt-6 flex items-center justify-center text-sm text-gray-500 dark:text-gray-400">
          <span className="mr-2">🔒</span>
          Pago seguro encriptado SSL
        </div>
      </div>
    </div>
  );
}
