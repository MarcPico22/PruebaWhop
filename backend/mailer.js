const sgMail = require('@sendgrid/mail');

// Configurar SendGrid si existe API key
const apiKey = process.env.SENDGRID_API_KEY;
if (apiKey && apiKey.trim()) {
  sgMail.setApiKey(apiKey);
}

/**
 * Envía email (o loguea si no hay SendGrid configurado)
 */
async function sendEmail(to, subject, html) {
  const fromEmail = process.env.FROM_EMAIL || 'no-reply@local.dev';
  
  const msg = {
    to,
    from: fromEmail,
    subject,
    html
  };
  
  // Si no hay API key, solo loguear
  if (!apiKey || !apiKey.trim()) {
    console.log('\n📧 EMAIL (simulado, no hay SendGrid API key):');
    console.log(`   Para: ${to}`);
    console.log(`   Asunto: ${subject}`);
    console.log(`   Contenido:\n${html}\n`);
    return { simulated: true };
  }
  
  try {
    await sgMail.send(msg);
    console.log(`✅ Email enviado a ${to}`);
    return { sent: true };
  } catch (error) {
    console.error('❌ Error enviando email:', error.message);
    throw error;
  }
}

/**
 * Envía email de pago fallido inicial
 */
async function sendPaymentFailedEmail(email, product, amount, retryLink) {
  const subject = `Tu pago para ${product} falló — reintenta aquí`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #DC2626;">⚠️ Pago fallido</h2>
      <p>Hola,</p>
      <p>Tu pago de <strong>$${amount}</strong> para <strong>${product}</strong> no pudo procesarse.</p>
      <p>Intentaremos automáticamente procesar el pago de nuevo, pero también puedes reintentar manualmente:</p>
      <div style="margin: 30px 0; text-align: center;">
        <a href="${retryLink}" 
           style="background: #2563EB; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block;">
          Reintentar pago ahora
        </a>
      </div>
      <p style="color: #666; font-size: 14px;">Si tienes preguntas, contáctanos.</p>
    </div>
  `;
  
  return sendEmail(email, subject, html);
}

/**
 * Envía email de reintento fallido
 */
async function sendRetryFailedEmail(email, product, amount, retryCount, retryLink) {
  const subject = `Reintento ${retryCount} para ${product} — aún sin éxito`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #F59E0B;">🔄 Reintento fallido</h2>
      <p>Hola,</p>
      <p>Intentamos procesar tu pago de <strong>$${amount}</strong> para <strong>${product}</strong>, pero aún no fue posible.</p>
      <p>Número de intentos: <strong>${retryCount}/3</strong></p>
      <p>Puedes intentar manualmente:</p>
      <div style="margin: 30px 0; text-align: center;">
        <a href="${retryLink}" 
           style="background: #2563EB; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block;">
          Reintentar pago ahora
        </a>
      </div>
      <p style="color: #666; font-size: 14px;">Seguiremos intentando automáticamente.</p>
    </div>
  `;
  
  return sendEmail(email, subject, html);
}

/**
 * Envía email de pago recuperado
 */
async function sendPaymentRecoveredEmail(email, product, amount) {
  const subject = `✅ Pago exitoso para ${product}`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #059669;">✅ ¡Pago completado!</h2>
      <p>Hola,</p>
      <p>Tu pago de <strong>$${amount}</strong> para <strong>${product}</strong> fue procesado exitosamente.</p>
      <p style="color: #666; font-size: 14px;">Gracias por tu paciencia. ¡Disfruta tu compra!</p>
    </div>
  `;
  
  return sendEmail(email, subject, html);
}

/**
 * Envía email de fallo permanente
 */
async function sendPaymentPermanentFailEmail(email, product, amount) {
  const subject = `No pudimos procesar tu pago para ${product}`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #DC2626;">❌ Pago no procesado</h2>
      <p>Hola,</p>
      <p>Después de varios intentos, no pudimos procesar tu pago de <strong>$${amount}</strong> para <strong>${product}</strong>.</p>
      <p>Por favor, contacta con soporte para resolver este problema.</p>
      <p style="color: #666; font-size: 14px;">Lamentamos las molestias.</p>
    </div>
  `;
  
  return sendEmail(email, subject, html);
}

module.exports = {
  sendEmail,
  sendPaymentFailedEmail,
  sendRetryFailedEmail,
  sendPaymentRecoveredEmail,
  sendPaymentPermanentFailEmail
};
