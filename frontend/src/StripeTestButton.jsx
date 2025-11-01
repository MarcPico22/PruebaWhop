import React, { useState } from 'react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

/**
 * Botón de prueba para verificar que Stripe funciona
 * Producto de prueba: €0.10
 * ELIMINAR DESPUÉS DE PROBAR
 */
function StripeTestButton() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleTestPayment = async () => {
    try {
      setLoading(true);
      setError('');

      const token = localStorage.getItem('token');
      if (!token) {
        alert('Debes estar logueado');
        return;
      }

      console.log('💳 Iniciando test checkout (€0.10)...');

      // Crear checkout con el producto de prueba (priceId viene del backend .env)
      const response = await axios.post(
        `${API_URL}/api/test-checkout`,
        {}, // Sin body, el priceId está en el backend
        { headers: { 'Authorization': `Bearer ${token}` } }
      );

      console.log('✅ Checkout URL:', response.data.url);

      // Redirigir a Stripe Checkout
      window.location.href = response.data.url;

    } catch (err) {
      console.error('❌ Error:', err);
      setError(err.response?.data?.error || 'Error creando checkout de prueba');
      setLoading(false);
    }
  };

  // Solo mostrar en desarrollo
  if (import.meta.env.PROD) return null;

  return (
    <div className="fixed bottom-20 right-4 z-50">
      <button
        onClick={handleTestPayment}
        disabled={loading}
        className="px-4 py-3 bg-green-600 text-white rounded-lg shadow-lg hover:bg-green-700 transition-all text-sm font-semibold disabled:opacity-50 flex items-center gap-2"
        title="Pagar €0.10 para probar Stripe"
      >
        {loading ? (
          <>⏳ Procesando...</>
        ) : (
          <>💳 Test Stripe (€0.10)</>
        )}
      </button>
      {error && (
        <div className="mt-2 bg-red-100 text-red-700 text-xs p-2 rounded">
          {error}
        </div>
      )}
    </div>
  );
}

export default StripeTestButton;
