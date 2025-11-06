import React, { useState, useEffect } from 'react';
import { API_URL } from '../config';

/**
 * Componente para configurar integraciones (Stripe + Resend + Whop)
 * Cada empresa configura sus propias API keys
 */
function IntegrationsSettings() {
  const [activeTab, setActiveTab] = useState('stripe');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [message, setMessage] = useState(null);
  
  // Estado para Stripe
  const [stripeData, setStripeData] = useState({
    stripe_secret_key: '',
    stripe_publishable_key: '',
    stripe_webhook_secret: ''
  });
  
  // Estado para Resend
  const [resendData, setResendData] = useState({
    resend_api_key: '',
    from_email: ''
  });
  
  // Estado para Whop
  const [whopData, setWhopData] = useState({
    whop_api_key: ''
  });
  
  // Estado para mostrar keys enmascaradas
  const [currentIntegrations, setCurrentIntegrations] = useState(null);

  useEffect(() => {
    loadIntegrations();
  }, []);

  /**
   * Carga integraciones actuales (keys enmascaradas)
   */
  const loadIntegrations = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/integrations`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setCurrentIntegrations(data);
      }
    } catch (error) {
      console.error('Error cargando integraciones:', error);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Guarda configuración de Stripe
   */
  const saveStripe = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('${API_URL}/api/integrations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(stripeData)
      });
      
      const result = await response.json();
      
      if (response.ok) {
        setMessage({ type: 'success', text: '✅ Stripe configurado correctamente' });
        setStripeData({ stripe_secret_key: '', stripe_publishable_key: '', stripe_webhook_secret: '' });
        await loadIntegrations();
      } else {
        setMessage({ type: 'error', text: `❌ ${result.error || 'Error guardando Stripe'}` });
      }
    } catch (error) {
      setMessage({ type: 'error', text: '❌ Error de conexión' });
      console.error('Error:', error);
    } finally {
      setSaving(false);
    }
  };

  /**
   * Guarda configuración de Resend
   */
  const saveResend = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/integrations/resend`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(resendData)
      });
      
      const result = await response.json();
      
      if (response.ok) {
        setMessage({ type: 'success', text: '✅ Resend configurado correctamente' });
        setResendData({ resend_api_key: '', from_email: '' });
        await loadIntegrations();
      } else {
        setMessage({ type: 'error', text: `❌ ${result.error || 'Error guardando Resend'}` });
      }
    } catch (error) {
      setMessage({ type: 'error', text: '❌ Error de conexión' });
      console.error('Error:', error);
    } finally {
      setSaving(false);
    }
  };

  /**
   * Guarda configuración de Whop
   */
  const saveWhop = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('${API_URL}/api/integrations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(whopData)
      });
      
      const result = await response.json();
      
      if (response.ok) {
        setMessage({ type: 'success', text: '✅ Whop configurado correctamente' });
        setWhopData({ whop_api_key: '' });
        await loadIntegrations();
      } else {
        setMessage({ type: 'error', text: `❌ ${result.error || 'Error guardando Whop'}` });
      }
    } catch (error) {
      setMessage({ type: 'error', text: '❌ Error de conexión' });
      console.error('Error:', error);
    } finally {
      setSaving(false);
    }
  };

  /**
   * Sincroniza pagos fallidos desde Whop manualmente
   */
  const syncWhopPayments = async () => {
    setSyncing(true);
    setMessage(null);
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('${API_URL}/api/whop/sync', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const result = await response.json();
      
      if (response.ok) {
        setMessage({ 
          type: 'success', 
          text: `✅ ${result.message} (${result.stats.total} total, ${result.stats.inserted} nuevos)` 
        });
      } else {
        setMessage({ type: 'error', text: `❌ ${result.error || 'Error sincronizando'}` });
      }
    } catch (error) {
      setMessage({ type: 'error', text: '❌ Error de conexión' });
      console.error('Error:', error);
    } finally {
      setSyncing(false);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '40px' }}>
        <p>Cargando integraciones...</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <h2>⚙️ Integraciones</h2>
      <p style={{ color: '#666', marginBottom: '30px' }}>
        Configura tus propias API keys de Stripe y resend. Todas las keys se guardan encriptadas.
      </p>

      {/* Mensaje de feedback */}
      {message && (
        <div style={{
          padding: '12px 20px',
          marginBottom: '20px',
          borderRadius: '8px',
          backgroundColor: message.type === 'success' ? '#D1FAE5' : '#FEE2E2',
          color: message.type === 'success' ? '#065F46' : '#991B1B',
          border: `1px solid ${message.type === 'success' ? '#10B981' : '#EF4444'}`
        }}>
          {message.text}
        </div>
      )}

      {/* Tabs */}
      <div style={{ 
        display: 'flex', 
        gap: '10px', 
        borderBottom: '2px solid #E5E7EB',
        marginBottom: '30px'
      }}>
        <button
          onClick={() => setActiveTab('stripe')}
          style={{
            padding: '12px 24px',
            border: 'none',
            background: 'none',
            cursor: 'pointer',
            fontWeight: '600',
            color: activeTab === 'stripe' ? '#2563EB' : '#6B7280',
            borderBottom: activeTab === 'stripe' ? '3px solid #2563EB' : 'none',
            marginBottom: '-2px'
          }}
        >
          💳 Stripe
        </button>
        <button
          onClick={() => setActiveTab('resend')}
          style={{
            padding: '12px 24px',
            border: 'none',
            background: 'none',
            cursor: 'pointer',
            fontWeight: '600',
            color: activeTab === 'resend' ? '#2563EB' : '#6B7280',
            borderBottom: activeTab === 'resend' ? '3px solid #2563EB' : 'none',
            marginBottom: '-2px'
          }}
        >
          📧 resend
        </button>
        <button
          onClick={() => setActiveTab('whop')}
          style={{
            padding: '12px 24px',
            border: 'none',
            background: 'none',
            cursor: 'pointer',
            fontWeight: '600',
            color: activeTab === 'whop' ? '#2563EB' : '#6B7280',
            borderBottom: activeTab === 'whop' ? '3px solid #2563EB' : 'none',
            marginBottom: '-2px'
          }}
        >
          🔄 Whop API
        </button>
      </div>

      {/* Stripe Tab */}
      {activeTab === 'stripe' && (
        <div>
          <h3>Configuración de Stripe</h3>
          
          {/* Estado actual */}
          {currentIntegrations?.is_stripe_connected && (
            <div style={{
              padding: '16px',
              backgroundColor: '#D1FAE5',
              border: '1px solid #10B981',
              borderRadius: '8px',
              marginBottom: '20px'
            }}>
              <p style={{ margin: '0 0 8px 0', fontWeight: '600', color: '#065F46' }}>
                ✅ Stripe conectado
              </p>
              <p style={{ margin: '4px 0', fontSize: '14px', color: '#047857', fontFamily: 'monospace' }}>
                Secret Key: {currentIntegrations.stripe_secret_key || 'No configurada'}
              </p>
              <p style={{ margin: '4px 0', fontSize: '14px', color: '#047857', fontFamily: 'monospace' }}>
                Publishable Key: {currentIntegrations.stripe_publishable_key || 'No configurada'}
              </p>
              <p style={{ margin: '4px 0', fontSize: '14px', color: '#047857', fontFamily: 'monospace' }}>
                Webhook Secret: {currentIntegrations.stripe_webhook_secret || 'No configurada'}
              </p>
            </div>
          )}

          <form onSubmit={saveStripe}>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontWeight: '600', marginBottom: '8px' }}>
                Secret Key *
              </label>
              <input
                type="password"
                value={stripeData.stripe_secret_key}
                onChange={(e) => setStripeData({ ...stripeData, stripe_secret_key: e.target.value })}
                placeholder="sk_test_... o sk_live_..."
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #D1D5DB',
                  borderRadius: '6px',
                  fontFamily: 'monospace',
                  fontSize: '14px'
                }}
                required
              />
              <p style={{ fontSize: '12px', color: '#6B7280', marginTop: '4px' }}>
                Encuentra esta key en tu <a href="https://dashboard.stripe.com/apikeys" target="_blank" rel="noopener noreferrer">Dashboard de Stripe</a>
              </p>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontWeight: '600', marginBottom: '8px' }}>
                Publishable Key *
              </label>
              <input
                type="text"
                value={stripeData.stripe_publishable_key}
                onChange={(e) => setStripeData({ ...stripeData, stripe_publishable_key: e.target.value })}
                placeholder="pk_test_... o pk_live_..."
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #D1D5DB',
                  borderRadius: '6px',
                  fontFamily: 'monospace',
                  fontSize: '14px'
                }}
                required
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontWeight: '600', marginBottom: '8px' }}>
                Webhook Secret (opcional)
              </label>
              <input
                type="password"
                value={stripeData.stripe_webhook_secret}
                onChange={(e) => setStripeData({ ...stripeData, stripe_webhook_secret: e.target.value })}
                placeholder="whsec_..."
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #D1D5DB',
                  borderRadius: '6px',
                  fontFamily: 'monospace',
                  fontSize: '14px'
                }}
              />
              <p style={{ fontSize: '12px', color: '#6B7280', marginTop: '4px' }}>
                Configura webhooks en <a href="https://dashboard.stripe.com/webhooks" target="_blank" rel="noopener noreferrer">Stripe Webhooks</a>
              </p>
            </div>

            <button
              type="submit"
              disabled={saving}
              style={{
                padding: '12px 32px',
                backgroundColor: saving ? '#9CA3AF' : '#2563EB',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontWeight: '600',
                cursor: saving ? 'not-allowed' : 'pointer'
              }}
            >
              {saving ? 'Guardando...' : 'Guardar Stripe'}
            </button>
          </form>
        </div>
      )}

      {/* resend Tab */}
      {activeTab === 'resend' && (
        <div>
          <h3>Configuración de resend</h3>
          
          {/* Estado actual */}
          {currentIntegrations?.is_resend_connected && (
            <div style={{
              padding: '16px',
              backgroundColor: '#D1FAE5',
              border: '1px solid #10B981',
              borderRadius: '8px',
              marginBottom: '20px'
            }}>
              <p style={{ margin: '0 0 8px 0', fontWeight: '600', color: '#065F46' }}>
                ✅ resend conectado
              </p>
              <p style={{ margin: '4px 0', fontSize: '14px', color: '#047857', fontFamily: 'monospace' }}>
                API Key: {currentIntegrations.resend_api_key || 'No configurada'}
              </p>
              <p style={{ margin: '4px 0', fontSize: '14px', color: '#047857' }}>
                Email remitente: {currentIntegrations.from_email || 'No configurado'}
              </p>
            </div>
          )}

          <form onSubmit={saveresend}>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontWeight: '600', marginBottom: '8px' }}>
                API Key *
              </label>
              <input
                type="password"
                value={resendData.resend_api_key}
                onChange={(e) => setresendData({ ...resendData, resend_api_key: e.target.value })}
                placeholder="SG...."
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #D1D5DB',
                  borderRadius: '6px',
                  fontFamily: 'monospace',
                  fontSize: '14px'
                }}
                required
              />
              <p style={{ fontSize: '12px', color: '#6B7280', marginTop: '4px' }}>
                Crea una API key en <a href="https://app.resend.com/settings/api_keys" target="_blank" rel="noopener noreferrer">resend API Keys</a>
              </p>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontWeight: '600', marginBottom: '8px' }}>
                Email remitente *
              </label>
              <input
                type="email"
                value={resendData.from_email}
                onChange={(e) => setresendData({ ...resendData, from_email: e.target.value })}
                placeholder="no-reply@tuempresa.com"
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #D1D5DB',
                  borderRadius: '6px',
                  fontSize: '14px'
                }}
                required
              />
              <p style={{ fontSize: '12px', color: '#6B7280', marginTop: '4px' }}>
                Debe ser un email verificado en resend
              </p>
            </div>

            <button
              type="submit"
              disabled={saving}
              style={{
                padding: '12px 32px',
                backgroundColor: saving ? '#9CA3AF' : '#2563EB',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontWeight: '600',
                cursor: saving ? 'not-allowed' : 'pointer'
              }}
            >
              {saving ? 'Guardando...' : 'Guardar resend'}
            </button>
          </form>
        </div>
      )}

      {/* Whop API Tab */}
      {activeTab === 'whop' && (
        <div>
          <h3>Configuración de Whop API</h3>
          <p style={{ color: '#666', marginBottom: '20px' }}>
            Conecta tu cuenta de Whop para sincronizar automáticamente los pagos fallidos.
          </p>
          
          {/* Estado actual */}
          {currentIntegrations?.is_whop_connected && (
            <div style={{
              padding: '16px',
              backgroundColor: '#D1FAE5',
              border: '1px solid #10B981',
              borderRadius: '8px',
              marginBottom: '20px'
            }}>
              <p style={{ margin: '0 0 8px 0', fontWeight: '600', color: '#065F46' }}>
                ✅ Whop API conectada
              </p>
              <p style={{ margin: '4px 0', fontSize: '14px', color: '#047857', fontFamily: 'monospace' }}>
                API Key: {currentIntegrations.whop_api_key || 'No configurada'}
              </p>
              
              {/* Botón de sincronización manual */}
              <button
                onClick={syncWhopPayments}
                disabled={syncing}
                style={{
                  marginTop: '15px',
                  padding: '10px 20px',
                  backgroundColor: syncing ? '#9CA3AF' : '#10B981',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontWeight: '600',
                  cursor: syncing ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                {syncing ? '🔄 Sincronizando...' : '🔄 Sincronizar Ahora'}
              </button>
              <p style={{ fontSize: '12px', color: '#047857', marginTop: '8px' }}>
                💡 La sincronización automática se ejecuta cada 5 minutos
              </p>
            </div>
          )}

          <form onSubmit={saveWhop}>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontWeight: '600', marginBottom: '8px' }}>
                Whop API Key *
              </label>
              <input
                type="password"
                value={whopData.whop_api_key}
                onChange={(e) => setWhopData({ ...whopData, whop_api_key: e.target.value })}
                placeholder="whop_xxxxxxxxxxxxx"
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #D1D5DB',
                  borderRadius: '6px',
                  fontFamily: 'monospace',
                  fontSize: '14px'
                }}
                required
              />
              <p style={{ fontSize: '12px', color: '#6B7280', marginTop: '4px' }}>
                Obtén tu API key desde <a href="https://whop.com/settings/api" target="_blank" rel="noopener noreferrer">Whop Dashboard → Settings → API</a>
              </p>
            </div>

            <button
              type="submit"
              disabled={saving}
              style={{
                padding: '12px 32px',
                backgroundColor: saving ? '#9CA3AF' : '#2563EB',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontWeight: '600',
                cursor: saving ? 'not-allowed' : 'pointer'
              }}
            >
              {saving ? 'Guardando...' : 'Guardar Whop API'}
            </button>
          </form>

          {/* Información sobre Webhooks */}
          <div style={{
            marginTop: '30px',
            padding: '16px',
            backgroundColor: '#EFF6FF',
            border: '1px solid #3B82F6',
            borderRadius: '8px'
          }}>
            <h4 style={{ margin: '0 0 10px 0', color: '#1E40AF' }}>
              🔔 Configurar Webhook en Whop (Opcional)
            </h4>
            <p style={{ fontSize: '14px', color: '#1E40AF', margin: '0 0 10px 0' }}>
              Para recibir notificaciones en tiempo real de pagos fallidos:
            </p>
            <ol style={{ fontSize: '14px', color: '#1E40AF', margin: '0', paddingLeft: '20px' }}>
              <li>Ve a Whop Dashboard → Settings → Webhooks</li>
              <li>Crea un nuevo webhook con esta URL:</li>
            </ol>
            <code style={{
              display: 'block',
              marginTop: '10px',
              padding: '10px',
              backgroundColor: 'white',
              border: '1px solid #3B82F6',
              borderRadius: '4px',
              fontFamily: 'monospace',
              fontSize: '13px',
              color: '#1E40AF',
              overflowX: 'auto'
            }}>
              {window.location.origin}/webhook/whop-sync/{localStorage.getItem('userId') || 'YOUR_TENANT_ID'}
            </code>
            <p style={{ fontSize: '12px', color: '#1E40AF', margin: '10px 0 0 0' }}>
              3. Selecciona el evento: <strong>payment.failed</strong>
            </p>
          </div>
        </div>
      )}

      {/* Ayuda */}
      <div style={{
        marginTop: '40px',
        padding: '20px',
        backgroundColor: '#F3F4F6',
        borderRadius: '8px',
        borderLeft: '4px solid #3B82F6'
      }}>
        <h4 style={{ marginTop: 0 }}>ℹ️ Información importante</h4>
        <ul style={{ margin: 0, paddingLeft: '20px', color: '#374151' }}>
          <li>Todas las API keys se guardan <strong>encriptadas</strong> en la base de datos</li>
          <li>Solo tú puedes ver y usar tus propias keys</li>
          <li>Stripe cobra directamente a tu cuenta (no a la nuestra)</li>
          <li>resend envía emails desde tu cuenta de email verificada</li>
          <li>Puedes actualizar las keys en cualquier momento</li>
        </ul>
      </div>
    </div>
  );
}

export default IntegrationsSettings;
