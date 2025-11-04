import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { trackPlanClick, trackCheckoutStart } from './analytics';
import { useTranslation } from 'react-i18next';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// Plan features definitions
const PLAN_FEATURES = {
  FREE: [
    { text: '14 días de prueba gratuita', included: true },
    { text: 'Hasta 50 pagos/mes', included: true },
    { text: 'Reintentos automáticos', included: true },
    { text: 'Email notifications', included: true },
    { text: 'Dashboard básico', included: true },
    { text: 'Soporte por email', included: false },
    { text: 'API access', included: false }
  ],
  PRO: [
    { text: 'Hasta 500 pagos/mes', included: true },
    { text: 'Reintentos ilimitados', included: true },
    { text: 'Email notifications', included: true },
    { text: 'Dashboard avanzado', included: true },
    { text: 'Analytics en tiempo real', included: true },
    { text: 'Soporte prioritario', included: true },
    { text: 'API access', included: true },
    { text: 'Webhooks personalizados', included: true }
  ],
  ENTERPRISE: [
    { text: 'Pagos ilimitados', included: true },
    { text: 'Reintentos ilimitados', included: true },
    { text: 'Email notifications', included: true },
    { text: 'Dashboard enterprise', included: true },
    { text: 'Analytics avanzado + exportación', included: true },
    { text: 'Soporte 24/7', included: true },
    { text: 'API access completo', included: true },
    { text: 'Webhooks personalizados', included: true },
    { text: 'White-label', included: true },
    { text: 'Onboarding dedicado', included: true }
  ]
};

function Pricing() {
  const { t } = useTranslation();
  const [billingPeriod, setBillingPeriod] = useState('monthly');
  const [currentSubscription, setCurrentSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      if (token) {
        const response = await axios.get(`${API_URL}/api/subscription`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        setCurrentSubscription(response.data.subscription);
      }
      
      setLoading(false);
    } catch (err) {
      console.error('Error cargando datos:', err);
      setLoading(false);
    }
  };

  const handleUpgrade = async (planId) => {
    try {
      setUpgrading(true);
      setError('');
      
      const token = localStorage.getItem('token');
      
      if (!token) {
        navigate('/login');
        return;
      }
      
      let finalPlanId = planId;
      let price = planId === 'PRO' ? (billingPeriod === 'yearly' ? 499 : 49) : (billingPeriod === 'yearly' ? 2099 : 199);
      
      if (billingPeriod === 'yearly' && planId !== 'FREE') {
        finalPlanId = `${planId}_YEARLY`;
      } else if (billingPeriod === 'monthly' && planId !== 'FREE') {
        finalPlanId = `${planId}_MONTHLY`;
      }

      // 📊 Track inicio de checkout
      trackCheckoutStart(finalPlanId, planId, price, billingPeriod);
      
      const response = await axios.post(
        `${API_URL}/api/create-checkout`,
        { planId: finalPlanId },
        { headers: { 'Authorization': `Bearer ${token}` } }
      );

      window.location.href = response.data.url;
      
    } catch (err) {
      console.error('Error creando checkout:', err);
      setError(err.response?.data?.error || 'Error iniciando proceso de pago');
      setUpgrading(false);
    }
  };

  const isCurrentPlan = (planId) => {
    return currentSubscription?.plan?.toUpperCase() === planId;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12 sm:mb-16">
          <h1 className="text-3xl sm:text-5xl font-black text-gray-900 mb-4">
            {t('landing.pricing.title')}
          </h1>
          <p className="text-lg sm:text-xl text-gray-600 mb-8 sm:mb-12">
            {t('landing.pricing.subtitle')}
          </p>
          
          {/* Billing Toggle - Mobile Optimized */}
          <div className="inline-flex items-center gap-3 sm:gap-4 bg-white p-4 sm:p-6 rounded-2xl shadow-lg border-2 border-gray-200">
            <span className={`text-sm sm:text-base font-semibold transition-colors ${
              billingPeriod === 'monthly' ? 'text-purple-600' : 'text-gray-500'
            }`}>
              {t('pricing.billing.monthly')}
            </span>
            
            {/* Toggle Switch - Touch Optimized (48px) */}
            <button
              onClick={() => setBillingPeriod(prev => prev === 'monthly' ? 'yearly' : 'monthly')}
              className={`relative w-16 sm:w-20 h-10 sm:h-12 rounded-full transition-colors active:scale-95 ${
                billingPeriod === 'yearly' ? 'bg-purple-600' : 'bg-gray-300'
              }`}
              aria-label="Toggle billing period"
            >
              <div className={`absolute top-1 w-8 sm:w-10 h-8 sm:h-10 bg-white rounded-full shadow-md transition-transform ${
                billingPeriod === 'yearly' ? 'translate-x-7 sm:translate-x-9' : 'translate-x-1'
              }`} />
            </button>
            
            <div className="flex items-center gap-2">
              <span className={`text-sm sm:text-base font-semibold transition-colors ${
                billingPeriod === 'yearly' ? 'text-purple-600' : 'text-gray-500'
              }`}>
                {t('pricing.billing.yearly')}
              </span>
              <span className="px-2 sm:px-3 py-1 text-xs sm:text-sm font-bold bg-green-500 text-white rounded-full">
                {t('pricing.billing.discount')}
              </span>
            </div>
          </div>

          {/* Current Plan Badge */}
          {currentSubscription && (
            <div className="mt-6 inline-block px-4 py-2 bg-indigo-100 text-indigo-800 rounded-full text-sm font-semibold">
              {t('pricing.currentPlan')}: {currentSubscription.plan.toUpperCase()}
              {currentSubscription.trialDaysLeft > 0 && ` • ${t('pricing.trial')}: ${currentSubscription.trialDaysLeft}d`}
            </div>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div className="max-w-2xl mx-auto mb-8 bg-red-50 border-2 border-red-200 text-red-700 px-4 py-3 rounded-lg text-center">
            {error}
          </div>
        )}

        {/* Pricing Cards - Mobile Optimized Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 mb-12">
          {/* FREE PLAN */}
          <PricingCard
            name="Free"
            planId="FREE"
            price={0}
            billingPeriod={billingPeriod}
            features={PLAN_FEATURES.FREE}
            isCurrentPlan={isCurrentPlan('FREE')}
            onUpgrade={() => {}}
            disabled={true}
            badge={null}
          />

          {/* PRO PLAN */}
          <PricingCard
            name="Pro"
            planId="PRO"
            price={billingPeriod === 'yearly' ? 499 : 49}
            monthlyEquivalent={billingPeriod === 'yearly' ? 41.58 : null}
            billingPeriod={billingPeriod}
            features={PLAN_FEATURES.PRO}
            isCurrentPlan={isCurrentPlan('PRO')}
            onUpgrade={handleUpgrade}
            upgrading={upgrading}
            badge="Más popular"
            highlighted={true}
          />

          {/* ENTERPRISE PLAN */}
          <PricingCard
            name="Enterprise"
            planId="ENTERPRISE"
            price={billingPeriod === 'yearly' ? 2099 : 199}
            monthlyEquivalent={billingPeriod === 'yearly' ? 174.92 : null}
            billingPeriod={billingPeriod}
            features={PLAN_FEATURES.ENTERPRISE}
            isCurrentPlan={isCurrentPlan('ENTERPRISE')}
            onUpgrade={handleUpgrade}
            upgrading={upgrading}
            badge="Profesional"
          />
        </div>

        {/* Back to Dashboard */}
        <div className="text-center">
          <a
            href="/dashboard"
            className="inline-block px-6 py-3 text-sm font-medium text-gray-700 hover:text-gray-900 transition"
          >
            {t('pricing.backToDashboard')}
          </a>
        </div>
      </div>
    </div>
  );
}

// Componente PricingCard separado y responsive
function PricingCard({ 
  name, 
  planId, 
  price, 
  monthlyEquivalent,
  billingPeriod, 
  features, 
  isCurrentPlan, 
  onUpgrade, 
  upgrading, 
  badge,
  highlighted,
  disabled 
}) {
  return (
    <div className={`relative bg-white rounded-2xl shadow-xl border-2 p-6 sm:p-8 flex flex-col ${
      highlighted 
        ? 'border-purple-500 scale-100 sm:scale-105 shadow-2xl' 
        : 'border-gray-200'
    } ${isCurrentPlan ? 'ring-4 ring-indigo-500 ring-opacity-50' : ''}`}>
      {/* Badge */}
      {badge && (
        <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
          <span className={`px-4 py-1.5 text-xs font-bold rounded-full shadow-lg ${
            highlighted 
              ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white'
              : 'bg-gradient-to-r from-yellow-400 to-orange-400 text-gray-900'
          }`}>
            {badge}
          </span>
        </div>
      )}

      {/* Header */}
      <div className="text-center mb-6">
        <h3 className="text-2xl sm:text-3xl font-black text-gray-900 mb-4">{name}</h3>
        <div className="flex items-baseline justify-center gap-1">
          <span className="text-4xl sm:text-6xl font-black text-gray-900">€{price}</span>
          <span className="text-gray-600 text-sm sm:text-base">
            /{billingPeriod === 'yearly' ? 'año' : 'mes'}
          </span>
        </div>
        {monthlyEquivalent && (
          <p className="text-xs sm:text-sm text-gray-500 mt-2">
            €{monthlyEquivalent}/mes facturado anualmente
          </p>
        )}
      </div>

      {/* Features - Scrollable on mobile if too long */}
      <ul className="space-y-3 sm:space-y-4 mb-8 flex-1">
        {features.map((feature, i) => (
          <li key={i} className="flex items-start gap-3">
            <span className="text-green-500 text-lg sm:text-xl flex-shrink-0">✓</span>
            <span className="text-sm sm:text-base text-gray-700">{feature}</span>
          </li>
        ))}
      </ul>

      {/* Button - Touch Optimized (min 48px height) */}
      <button
        onClick={() => {
          // 📊 Track click en plan
          trackPlanClick(name, billingPeriod, price);
          onUpgrade(planId);
        }}
        disabled={isCurrentPlan || upgrading || disabled}
        className={`w-full py-4 px-6 rounded-xl text-base sm:text-lg font-bold transition-all active:scale-95 ${
          isCurrentPlan
            ? 'bg-gray-100 text-gray-500 cursor-default'
            : highlighted
            ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:from-purple-700 hover:to-indigo-700 shadow-lg'
            : 'bg-indigo-600 text-white hover:bg-indigo-700'
        } ${(disabled || upgrading) ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        {upgrading ? 'Procesando...' : isCurrentPlan ? '✓ Plan Actual' : 'Seleccionar Plan'}
      </button>
    </div>
  );
}

export default Pricing;
