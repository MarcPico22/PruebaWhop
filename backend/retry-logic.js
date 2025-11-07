const {
  getPaymentsDueForRetry,
  updatePaymentStatus,
  getPaymentById,
  getConfigValue,
  getUserByTenantId,
  getTenantIntegrations
} = require('./db');
const {
  sendRetryFailedEmail,
  sendPaymentRecoveredEmail,
  sendPaymentPermanentFailEmail
} = require('./mailer');
const { sendPaymentRecoveredNotification } = require('./notification-service');
const { sendRecoverySuccessEmail } = require('./email');
const { decrypt } = require('./encryption');
const Stripe = require('stripe');

/**
 * Intenta cobrar un pago usando la API real de Stripe
 * @param {Object} payment - Objeto de pago con id, tenant_id, amount, etc.
 * @param {string} tenantStripeKey - API key de Stripe del tenant (desencriptada)
 * @returns {Promise<boolean>} - true si el cobro fue exitoso, false si falló
 */
async function attemptCharge(payment, tenantStripeKey) {
  try {
    console.log(`🔄 Intentando cobro REAL para payment ${payment.id}...`);
    
    // Inicializar Stripe con la API key del tenant
    const stripe = Stripe(tenantStripeKey);
    
    // IMPORTANTE: Asumimos que payment.id es un PaymentIntent ID de Stripe
    // En producción, deberías tener un campo payment.stripe_payment_intent_id
    
    // Opción 1: Confirmar un PaymentIntent existente
    const paymentIntent = await stripe.paymentIntents.confirm(payment.id, {
      // Opcional: añadir método de pago si es necesario
      // payment_method: payment.payment_method_id
    });
    
    const success = paymentIntent.status === 'succeeded';
    console.log(`🔄 Cobro para ${payment.id}... ${success ? '✅ ÉXITO' : '❌ FALLO'} (status: ${paymentIntent.status})`);
    
    return success;
  } catch (error) {
    console.error(`❌ Error en API de Stripe para ${payment.id}:`, error.message);
    
    // Algunos errores de Stripe son recuperables, otros no
    // Por ahora, devolvemos false para cualquier error
    return false;
  }
}

/**
 * Procesa un reintento de pago
 */
async function processRetry(payment) {
  // 1. Obtener la API key de Stripe del tenant
  const integrations = getTenantIntegrations(payment.tenant_id);
  
  if (!integrations || !integrations.stripe_secret_key) {
    console.error(`❌ No se encontró Stripe API key para tenant ${payment.tenant_id}`);
    // Marcar el reintento como fallido
    const newRetries = payment.retries + 1;
    updatePaymentStatus(payment.id, 'pending', newRetries);
    return { success: false, status: 'error', error: 'No Stripe API key configured' };
  }
  
  // 2. Desencriptar la API key
  let tenantStripeKey;
  try {
    tenantStripeKey = decrypt(integrations.stripe_secret_key);
  } catch (error) {
    console.error(`❌ Error desencriptando Stripe API key para tenant ${payment.tenant_id}:`, error.message);
    return { success: false, status: 'error', error: 'Failed to decrypt Stripe key' };
  }
  
  // 3. Intentar el cobro con la API real de Stripe
  const success = await attemptCharge(payment, tenantStripeKey);
  
  if (success) {
    // ✅ Pago recuperado
    updatePaymentStatus(payment.id, 'recovered');
    await sendPaymentRecoveredEmail(payment.email, payment.product, payment.amount, payment.tenant_id);
    
    // Enviar notificación a la empresa
    await sendPaymentRecoveredNotification(payment, 'Reintento automático');
    
    // Enviar email al usuario de la plataforma (SendGrid)
    try {
      const user = getUserByTenantId(payment.tenant_id);
      if (user) {
        await sendRecoverySuccessEmail(
          user.email, 
          user.company_name, 
          payment.amount, 
          payment.customer_name || payment.email
        );
        console.log(`✅ Recovery success email sent to ${user.email}`);
      }
    } catch (emailError) {
      console.error('❌ Error sending recovery email:', emailError);
    }
    
    console.log(`✅ Pago ${payment.id} recuperado exitosamente`);
    return { success: true, status: 'recovered' };
  } else {
    // ❌ Fallo en el intento
    const newRetries = payment.retries + 1;
    
    // Obtener max_retries desde config (por tenant)
    const maxRetriesConfig = getConfigValue('max_retries', payment.tenant_id);
    const maxRetries = maxRetriesConfig ? parseInt(maxRetriesConfig) : 3;
    
    if (newRetries >= maxRetries) {
      // Fallo permanente después de N intentos
      updatePaymentStatus(payment.id, 'failed-permanent', newRetries);
      await sendPaymentPermanentFailEmail(payment.email, payment.product, payment.amount, payment.tenant_id);
      console.log(`❌ Pago ${payment.id} marcado como fallo permanente (${maxRetries} intentos)`);
      return { success: false, status: 'failed-permanent', retries: newRetries };
    } else {
      // Programar siguiente reintento usando config de DB (por tenant)
      const retryIntervalsConfig = getConfigValue('retry_intervals', payment.tenant_id) || process.env.RETRY_INTERVALS || '60,300,900';
      const retryIntervals = retryIntervalsConfig.split(',').map(Number);
      const now = Math.floor(Date.now() / 1000);
      const nextAttempt = now + retryIntervals[newRetries]; // Siguiente intervalo
      
      updatePaymentStatus(payment.id, 'pending', newRetries, nextAttempt);
      await sendRetryFailedEmail(payment.email, payment.product, payment.amount, newRetries, payment.retry_link, payment.tenant_id);
      console.log(`⏳ Pago ${payment.id} reintento ${newRetries}/${maxRetries}, siguiente en ${retryIntervals[newRetries]}s`);
      return { success: false, status: 'pending', retries: newRetries, nextAttempt };
    }
  }
}

/**
 * Scheduler que se ejecuta periódicamente para procesar reintentos automáticos
 */
function startRetryScheduler() {
  const INTERVAL = 30000; // Cada 30 segundos
  
  setInterval(async () => {
    const duePayments = getPaymentsDueForRetry();
    
    if (duePayments.length > 0) {
      console.log(`\n⏰ Scheduler: ${duePayments.length} pago(s) listo(s) para reintento`);
      
      for (const payment of duePayments) {
        await processRetry(payment);
      }
    }
  }, INTERVAL);
  
  console.log(`⏰ Scheduler de reintentos iniciado (cada ${INTERVAL/1000}s)`);
}

module.exports = {
  attemptCharge,
  processRetry,
  startRetryScheduler
};
