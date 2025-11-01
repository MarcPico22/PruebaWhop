/**
 * Google Analytics 4 Event Tracking
 * Documentación: https://developers.google.com/analytics/devguides/collection/ga4/events
 */

/**
 * Envía un evento a Google Analytics
 */
export const trackEvent = (eventName, eventParams = {}) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', eventName, eventParams);
    console.log(`📊 GA Event: ${eventName}`, eventParams);
  } else {
    console.warn('⚠️ Google Analytics no está disponible');
  }
};

/**
 * Evento: Usuario completa signup
 */
export const trackSignup = (method = 'email') => {
  trackEvent('sign_up', {
    method: method,
    timestamp: new Date().toISOString()
  });
};

/**
 * Evento: Usuario completa login
 */
export const trackLogin = (method = 'email') => {
  trackEvent('login', {
    method: method,
    timestamp: new Date().toISOString()
  });
};

/**
 * Evento: Click en botón "Seleccionar Plan"
 */
export const trackPlanClick = (planName, billingPeriod, price) => {
  trackEvent('select_plan_click', {
    plan_name: planName,
    billing_period: billingPeriod,
    value: price,
    currency: 'EUR'
  });
};

/**
 * Evento: Inicio de proceso de checkout
 */
export const trackCheckoutStart = (planId, planName, price, billingPeriod) => {
  trackEvent('begin_checkout', {
    plan_id: planId,
    plan_name: planName,
    value: price,
    currency: 'EUR',
    billing_period: billingPeriod,
    items: [{
      item_id: planId,
      item_name: planName,
      price: price,
      quantity: 1
    }]
  });
};

/**
 * Evento: Checkout completado (conversión)
 */
export const trackPurchase = (transactionId, planId, planName, price) => {
  trackEvent('purchase', {
    transaction_id: transactionId,
    value: price,
    currency: 'EUR',
    plan_id: planId,
    plan_name: planName,
    items: [{
      item_id: planId,
      item_name: planName,
      price: price,
      quantity: 1
    }]
  });
};

/**
 * Evento: Click en CTA de landing page
 */
export const trackCTAClick = (ctaLocation, ctaText) => {
  trackEvent('cta_click', {
    location: ctaLocation, // 'hero', 'features', 'pricing'
    text: ctaText
  });
};

/**
 * Evento: Cálculo de pérdidas (MoneyLossCalculator)
 */
export const trackCalculatorUse = (monthlyRevenue, lossCalculated) => {
  trackEvent('calculator_use', {
    monthly_revenue: monthlyRevenue,
    estimated_loss: lossCalculated,
    currency: 'EUR'
  });
};

/**
 * Evento: Scroll profundo en landing
 */
export const trackDeepScroll = (scrollPercentage) => {
  trackEvent('scroll', {
    percent_scrolled: scrollPercentage
  });
};

/**
 * Evento: Error de aplicación
 */
export const trackError = (errorType, errorMessage, errorLocation) => {
  trackEvent('app_error', {
    error_type: errorType,
    error_message: errorMessage,
    location: errorLocation,
    timestamp: new Date().toISOString()
  });
};

export default {
  trackEvent,
  trackSignup,
  trackLogin,
  trackPlanClick,
  trackCheckoutStart,
  trackPurchase,
  trackCTAClick,
  trackCalculatorUse,
  trackDeepScroll,
  trackError
};
