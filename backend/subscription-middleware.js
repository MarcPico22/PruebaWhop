const { getSubscription, incrementPaymentsUsed } = require('./db');
const { canProcessPayment } = require('./plans');

/**
 * Middleware para verificar límites del plan
 * Bloquea la creación de pagos si se alcanzó el límite
 */
function checkPlanLimits(req, res, next) {
  try {
    const tenantId = req.user?.tenantId;
    
    if (!tenantId) {
      return res.status(401).json({
        error: 'No autorizado',
        message: 'Debes iniciar sesión para continuar'
      });
    }
    
    const subscription = getSubscription(tenantId);
    const check = canProcessPayment(subscription);
    
    if (!check.allowed) {
      return res.status(403).json({
        error: 'Límite alcanzado',
        message: check.message,
        reason: check.reason,
        subscription: {
          plan: subscription.plan,
          status: subscription.status,
          paymentsUsed: subscription.payments_used,
          paymentsLimit: subscription.payments_limit
        },
        upgradeUrl: '/pricing'
      });
    }
    
    // Adjuntar info de suscripción al request
    req.subscription = subscription;
    req.usageCheck = check;
    
    next();
  } catch (error) {
    console.error('Error en checkPlanLimits:', error);
    res.status(500).json({
      error: 'Error verificando límites',
      message: 'Ocurrió un error al verificar tu plan'
    });
  }
}

/**
 * Middleware para incrementar contador de pagos después de procesar
 * Usar DESPUÉS de que el pago se haya creado exitosamente
 */
function trackPaymentUsage(req, res, next) {
  try {
    const tenantId = req.user?.tenantId;
    
    if (tenantId) {
      incrementPaymentsUsed(tenantId);
      console.log(`✅ Pago contabilizado para tenant ${tenantId}`);
    }
    
    next();
  } catch (error) {
    console.error('Error en trackPaymentUsage:', error);
    // No bloqueamos la request, solo logueamos el error
    next();
  }
}

/**
 * Middleware opcional para verificar sin bloquear
 * Solo adjunta info de suscripción al request
 */
function attachSubscription(req, res, next) {
  try {
    const tenantId = req.user?.tenantId;
    
    if (tenantId) {
      const subscription = getSubscription(tenantId);
      const check = canProcessPayment(subscription);
      
      req.subscription = subscription;
      req.usageCheck = check;
    }
    
    next();
  } catch (error) {
    console.error('Error en attachSubscription:', error);
    next();
  }
}

/**
 * Middleware para verificar límites en webhooks
 * Similar a checkPlanLimits pero obtiene tenant_id del body
 */
function checkPlanLimitsWebhook(req, res, next) {
  try {
    const tenantId = req.body.tenant_id;
    
    if (!tenantId) {
      return res.status(400).json({
        error: 'tenant_id requerido',
        message: 'El webhook debe incluir tenant_id en el body'
      });
    }
    
    const subscription = getSubscription(tenantId);
    const check = canProcessPayment(subscription);
    
    if (!check.allowed) {
      return res.status(403).json({
        error: 'Límite alcanzado',
        message: check.message,
        reason: check.reason,
        subscription: {
          plan: subscription.plan,
          status: subscription.status,
          paymentsUsed: subscription.payments_used,
          paymentsLimit: subscription.payments_limit
        },
        upgradeUrl: '/pricing'
      });
    }
    
    // Adjuntar info de suscripción al request
    req.subscription = subscription;
    req.usageCheck = check;
    
    next();
  } catch (error) {
    console.error('Error en checkPlanLimitsWebhook:', error);
    res.status(500).json({
      error: 'Error verificando límites',
      message: 'Ocurrió un error al verificar el plan'
    });
  }
}

/**
 * Middleware para incrementar contador de pagos en webhooks
 * Usar DESPUÉS de que el pago se haya creado exitosamente
 */
function trackPaymentUsageWebhook(req, res, next) {
  try {
    const tenantId = req.body.tenant_id;
    
    if (tenantId) {
      incrementPaymentsUsed(tenantId);
      console.log(`✅ Pago contabilizado para tenant ${tenantId} (webhook)`);
    }
    
    next();
  } catch (error) {
    console.error('Error en trackPaymentUsageWebhook:', error);
    // No bloqueamos la request, solo logueamos el error
    next();
  }
}

module.exports = {
  checkPlanLimits,
  trackPaymentUsage,
  attachSubscription,
  checkPlanLimitsWebhook,
  trackPaymentUsageWebhook
};
