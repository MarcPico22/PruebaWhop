const {
  getPaymentsDueForRetry,
  updatePaymentStatus,
  getPaymentById,
  getConfigValue
} = require('./db');
const {
  sendRetryFailedEmail,
  sendPaymentRecoveredEmail,
  sendPaymentPermanentFailEmail
} = require('./mailer');
const { sendPaymentRecoveredNotification } = require('./notification-service');

/**
 * Simula un intento de cobro (30% probabilidad de éxito)
 */
function attemptCharge(payment) {
  const success = Math.random() < 0.3; // 30% de éxito
  console.log(`🔄 Intentando cobro para ${payment.id}... ${success ? '✅ ÉXITO' : '❌ FALLO'}`);
  return success;
}

/**
 * Procesa un reintento de pago
 */
async function processRetry(payment) {
  const success = attemptCharge(payment);
  
  if (success) {
    // ✅ Pago recuperado
    updatePaymentStatus(payment.id, 'recovered');
    await sendPaymentRecoveredEmail(payment.email, payment.product, payment.amount, payment.tenant_id);
    
    // Enviar notificación a la empresa
    await sendPaymentRecoveredNotification(payment, 'Reintento automático');
    
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
