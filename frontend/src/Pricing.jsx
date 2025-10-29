import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Pricing.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

function Pricing() {
  const [plans, setPlans] = useState([]);
  const [currentSubscription, setCurrentSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      // Cargar planes disponibles
      const plansResponse = await axios.get(`${API_URL}/api/plans`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setPlans(plansResponse.data.plans);

      // Cargar suscripción actual
      const subResponse = await axios.get(`${API_URL}/api/subscription`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setCurrentSubscription(subResponse.data.subscription);

      setLoading(false);
    } catch (err) {
      console.error('Error cargando datos:', err);
      setError('Error cargando información de planes');
      setLoading(false);
    }
  };

  const handleUpgrade = async (planId) => {
    try {
      setUpgrading(true);
      setError('');
      
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API_URL}/api/create-checkout`,
        { 
          planId,
          successUrl: `${window.location.origin}/dashboard?upgrade=success`,
          cancelUrl: `${window.location.origin}/pricing?upgrade=cancelled`
        },
        { headers: { 'Authorization': `Bearer ${token}` } }
      );

      // Redirigir a Stripe Checkout
      window.location.href = response.data.url;
      
    } catch (err) {
      console.error('Error creando checkout:', err);
      setError(err.response?.data?.error || 'Error iniciando proceso de pago');
      setUpgrading(false);
    }
  };

  const handleManageSubscription = async () => {
    try {
      setUpgrading(true);
      setError('');
      
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API_URL}/api/create-portal`,
        { returnUrl: window.location.href },
        { headers: { 'Authorization': `Bearer ${token}` } }
      );

      // Redirigir al Customer Portal de Stripe
      window.location.href = response.data.url;
      
    } catch (err) {
      console.error('Error abriendo portal:', err);
      setError('Error abriendo portal de suscripción');
      setUpgrading(false);
    }
  };

  const getButtonText = (planId) => {
    if (!currentSubscription || !currentSubscription.plan) return 'Seleccionar';
    
    const currentPlan = currentSubscription.plan.toUpperCase();
    const planIndex = { FREE: 0, PRO: 1, ENTERPRISE: 2 };
    
    if (currentPlan === planId) {
      return '✓ Plan Actual';
    }
    
    if (planIndex[currentPlan] > planIndex[planId]) {
      return 'Cambiar Plan';
    }
    
    return 'Actualizar';
  };

  const isCurrentPlan = (planId) => {
    return currentSubscription?.plan?.toUpperCase() === planId;
  };

  const canUpgrade = (planId) => {
    if (!currentSubscription || !currentSubscription.plan) return true;
    if (planId === 'FREE') return false;
    return true;
  };

  if (loading) {
    return (
      <div className="pricing-page">
        <div className="container">
          <div className="loading">Cargando planes...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="pricing-page">
      <div className="container">
        <header className="pricing-header">
          <h1>Planes y Precios</h1>
          <p>Elige el plan perfecto para tu negocio</p>
          
          {currentSubscription && currentSubscription.plan && (
            <div className="current-plan-badge">
              <span>Plan actual: <strong>{currentSubscription.plan.toUpperCase()}</strong></span>
              {currentSubscription.status === 'trialing' && (
                <span className="trial-badge">
                  Trial - {currentSubscription.trialDaysLeft} días restantes
                </span>
              )}
            </div>
          )}
        </header>

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        <div className="pricing-grid">
          {plans.map((plan) => (
            <div 
              key={plan.id} 
              className={`pricing-card ${isCurrentPlan(plan.id) ? 'current' : ''} ${plan.recommended ? 'recommended' : ''}`}
            >
              {plan.recommended && (
                <div className="recommended-badge">Recomendado</div>
              )}
              
              <div className="plan-header">
                <h2>{plan.name}</h2>
                <div className="plan-price">
                  <span className="currency">$</span>
                  <span className="amount">{plan.price}</span>
                  <span className="period">/mes</span>
                </div>
                {plan.id === 'FREE' && (
                  <div className="trial-info">14 días de prueba gratis</div>
                )}
              </div>

              <ul className="plan-features">
                {plan.features.map((feature, index) => (
                  <li key={index}>
                    <span className="check">✓</span>
                    {feature}
                  </li>
                ))}
              </ul>

              <button
                className={`plan-button ${isCurrentPlan(plan.id) ? 'current' : ''}`}
                onClick={() => canUpgrade(plan.id) && handleUpgrade(plan.id)}
                disabled={isCurrentPlan(plan.id) || upgrading || !canUpgrade(plan.id)}
              >
                {upgrading ? 'Procesando...' : getButtonText(plan.id)}
              </button>
            </div>
          ))}
        </div>

        {currentSubscription && currentSubscription.plan !== 'free' && (
          <div className="manage-subscription">
            <p>¿Necesitas cambiar tu método de pago o cancelar tu suscripción?</p>
            <button 
              className="portal-button"
              onClick={handleManageSubscription}
              disabled={upgrading}
            >
              Gestionar Suscripción
            </button>
          </div>
        )}

        <div className="pricing-faq">
          <h3>Preguntas Frecuentes</h3>
          <div className="faq-grid">
            <div className="faq-item">
              <h4>¿Puedo cancelar en cualquier momento?</h4>
              <p>Sí, puedes cancelar tu suscripción en cualquier momento desde el portal de cliente.</p>
            </div>
            <div className="faq-item">
              <h4>¿Qué pasa si alcanzo mi límite?</h4>
              <p>No podrás procesar más pagos hasta que actualices tu plan o esperes al siguiente mes.</p>
            </div>
            <div className="faq-item">
              <h4>¿Hay contrato a largo plazo?</h4>
              <p>No, todos los planes son mensuales y se renuevan automáticamente.</p>
            </div>
            <div className="faq-item">
              <h4>¿Puedo cambiar de plan después?</h4>
              <p>Sí, puedes actualizar o degradar tu plan en cualquier momento.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Pricing;
