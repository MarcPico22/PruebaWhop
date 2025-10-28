const { getNotificationSettings, getUserByTenantId } = require('./db');
const { sendEmail } = require('./mailer');
const {
  paymentRecoveredTemplate,
  dailySummaryTemplate,
  thresholdAlertTemplate
} = require('./email-templates');

/**
 * Envía notificación cuando se recupera un pago
 */
async function sendPaymentRecoveredNotification(payment, recoveryMethod = 'Reintento automático') {
  try {
    const settings = getNotificationSettings(payment.tenant_id);
    
    // Verificar si las notificaciones de recuperación están activadas
    if (!settings.email_on_recovery) {
      console.log(`ℹ️ Notificaciones de recuperación desactivadas para tenant ${payment.tenant_id}`);
      return { sent: false, reason: 'disabled' };
    }
    
    const user = getUserByTenantId(payment.tenant_id);
    const recipientEmail = settings.notification_email || user.email;
    
    if (!recipientEmail) {
      console.warn(`⚠️ No hay email de notificación configurado para tenant ${payment.tenant_id}`);
      return { sent: false, reason: 'no_email' };
    }
    
    // Generar contenido del email
    const emailContent = paymentRecoveredTemplate({
      companyName: user.company_name,
      customerEmail: payment.email,
      product: payment.product,
      amount: payment.amount,
      retries: payment.retries,
      recoveryMethod
    });
    
    // Enviar email
    await sendEmail(
      recipientEmail,
      emailContent.subject,
      emailContent.text,
      emailContent.html
    );
    
    console.log(`✅ Notificación de pago recuperado enviada a ${recipientEmail}`);
    
    return { sent: true, email: recipientEmail };
    
  } catch (error) {
    console.error('❌ Error enviando notificación de pago recuperado:', error);
    return { sent: false, error: error.message };
  }
}

/**
 * Envía resumen diario de pagos recuperados
 */
async function sendDailySummary(tenantId, paymentsRecovered, stats) {
  try {
    const settings = getNotificationSettings(tenantId);
    
    if (!settings.daily_summary) {
      return { sent: false, reason: 'disabled' };
    }
    
    const user = getUserByTenantId(tenantId);
    const recipientEmail = settings.notification_email || user.email;
    
    if (!recipientEmail) {
      return { sent: false, reason: 'no_email' };
    }
    
    const totalRecovered = paymentsRecovered.reduce((sum, p) => sum + p.amount, 0);
    const totalPayments = stats.total || 0;
    const recoveryRate = totalPayments > 0 
      ? Math.round((paymentsRecovered.length / totalPayments) * 100) 
      : 0;
    
    const emailContent = dailySummaryTemplate({
      companyName: user.company_name,
      date: new Date().toLocaleDateString('es-ES', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      }),
      totalRecovered: totalRecovered.toFixed(2),
      paymentsRecovered: paymentsRecovered.map(p => ({
        email: p.email,
        product: p.product,
        amount: p.amount.toFixed(2)
      })),
      pendingPayments: stats.pending || 0,
      totalPending: (stats.pending * 50).toFixed(2), // Estimación
      recoveryRate
    });
    
    await sendEmail(
      recipientEmail,
      emailContent.subject,
      emailContent.text,
      emailContent.html
    );
    
    console.log(`✅ Resumen diario enviado a ${recipientEmail}`);
    
    return { sent: true, email: recipientEmail };
    
  } catch (error) {
    console.error('❌ Error enviando resumen diario:', error);
    return { sent: false, error: error.message };
  }
}

/**
 * Envía alerta cuando se alcanza el umbral de pagos pendientes
 */
async function sendThresholdAlert(tenantId, pendingPayments, oldestPayment = null) {
  try {
    const settings = getNotificationSettings(tenantId);
    
    if (!settings.send_alerts) {
      return { sent: false, reason: 'alerts_disabled' };
    }
    
    // Verificar si se alcanzó el umbral
    if (pendingPayments.length < settings.alert_threshold) {
      return { sent: false, reason: 'below_threshold' };
    }
    
    const user = getUserByTenantId(tenantId);
    const recipientEmail = settings.notification_email || user.email;
    
    if (!recipientEmail) {
      return { sent: false, reason: 'no_email' };
    }
    
    const totalPending = pendingPayments.reduce((sum, p) => sum + p.amount, 0);
    
    let oldestData = null;
    if (oldestPayment) {
      const createdAt = new Date(oldestPayment.created_at * 1000);
      const daysAgo = Math.floor((Date.now() - createdAt) / (1000 * 60 * 60 * 24));
      oldestData = {
        email: oldestPayment.email,
        product: oldestPayment.product,
        amount: oldestPayment.amount.toFixed(2),
        daysAgo
      };
    }
    
    const emailContent = thresholdAlertTemplate({
      companyName: user.company_name,
      pendingPayments: pendingPayments.length,
      totalPending: totalPending.toFixed(2),
      threshold: settings.alert_threshold,
      oldestPayment: oldestData
    });
    
    await sendEmail(
      recipientEmail,
      emailContent.subject,
      emailContent.text,
      emailContent.html
    );
    
    console.log(`🚨 Alerta de umbral enviada a ${recipientEmail}`);
    
    return { sent: true, email: recipientEmail };
    
  } catch (error) {
    console.error('❌ Error enviando alerta de umbral:', error);
    return { sent: false, error: error.message };
  }
}

/**
 * Verifica si se debe enviar alerta de umbral (evita spam)
 * Solo envía una vez al día si se mantiene sobre el umbral
 */
function shouldSendThresholdAlert(tenantId) {
  // TODO: Implementar lógica de throttling
  // Por ahora, siempre permite enviar
  return true;
}

module.exports = {
  sendPaymentRecoveredNotification,
  sendDailySummary,
  sendThresholdAlert,
  shouldSendThresholdAlert
};
