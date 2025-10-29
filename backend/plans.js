/**
 * Definición de planes de suscripción
 */

const PLANS = {
  free: {
    id: 'free',
    name: 'Free',
    price: 0,
    priceId: null, // No tiene precio en Stripe
    paymentsLimit: 50,
    features: [
      'Hasta 50 pagos recuperados por mes',
      'Reintentos automáticos',
      'Emails de notificación',
      'Dashboard básico',
      'Soporte por email (48h)'
    ],
    trialDays: 14
  },
  
  pro: {
    id: 'pro',
    name: 'Pro',
    price: 49,
    priceId: process.env.STRIPE_PRICE_ID_PRO || 'price_pro_placeholder', // Configurar en Stripe
    paymentsLimit: 500,
    features: [
      'Hasta 500 pagos recuperados por mes',
      'Todo de Free +',
      'Reintentos ilimitados',
      'Configuración avanzada',
      'Notificaciones personalizadas',
      'Analytics y reportes',
      'Soporte por email (24h)',
      'API access'
    ]
  },
  
  enterprise: {
    id: 'enterprise',
    name: 'Enterprise',
    price: 199,
    priceId: process.env.STRIPE_PRICE_ID_ENTERPRISE || 'price_enterprise_placeholder',
    paymentsLimit: null, // Ilimitado
    features: [
      'Pagos recuperados ILIMITADOS',
      'Todo de Pro +',
      'Onboarding personalizado',
      'Soporte prioritario (2h)',
      'Webhooks personalizados',
      'Múltiples usuarios',
      'SLA garantizado',
      'Consultoría estratégica'
    ]
  }
};

/**
 * Obtiene la configuración de un plan
 */
function getPlan(planId) {
  return PLANS[planId] || PLANS.free;
}

/**
 * Obtiene todos los planes
 */
function getAllPlans() {
  return Object.values(PLANS);
}

/**
 * Verifica si un tenant puede procesar más pagos
 */
function canProcessPayment(subscription) {
  const now = Math.floor(Date.now() / 1000);
  
  // Verificar si el trial expiró
  if (subscription.status === 'trial' && subscription.trial_ends_at < now) {
    return {
      allowed: false,
      reason: 'trial_expired',
      message: 'Tu periodo de prueba ha terminado. Actualiza a un plan de pago para continuar.'
    };
  }
  
  // Verificar si la suscripción está activa
  if (subscription.status === 'past_due' || subscription.status === 'canceled') {
    return {
      allowed: false,
      reason: 'subscription_inactive',
      message: 'Tu suscripción no está activa. Por favor, actualiza tu método de pago.'
    };
  }
  
  // Plan Enterprise = ilimitado
  if (subscription.plan === 'enterprise' || subscription.payments_limit === null) {
    return {
      allowed: true
    };
  }
  
  // Verificar límite de pagos
  if (subscription.payments_used >= subscription.payments_limit) {
    return {
      allowed: false,
      reason: 'limit_reached',
      message: `Has alcanzado el límite de ${subscription.payments_limit} pagos de tu plan ${subscription.plan.toUpperCase()}. Actualiza tu plan para procesar más pagos.`,
      current: subscription.payments_used,
      limit: subscription.payments_limit
    };
  }
  
  return {
    allowed: true,
    current: subscription.payments_used,
    limit: subscription.payments_limit,
    remaining: subscription.payments_limit - subscription.payments_used
  };
}

/**
 * Calcula el porcentaje de uso del plan
 */
function getUsagePercentage(subscription) {
  if (!subscription.payments_limit) return 0; // Ilimitado
  return Math.round((subscription.payments_used / subscription.payments_limit) * 100);
}

/**
 * Verifica si debe mostrar warning de límite
 */
function shouldShowLimitWarning(subscription) {
  const percentage = getUsagePercentage(subscription);
  return percentage >= 80; // Mostrar warning al 80%
}

module.exports = {
  PLANS,
  getPlan,
  getAllPlans,
  canProcessPayment,
  getUsagePercentage,
  shouldShowLimitWarning
};
