const { MailerSend, EmailParams, Sender, Recipient } = require('mailersend');
const { getTenantIntegrations } = require('./db');
const { decrypt } = require('./encryption');

/**
 * Obtiene la configuración de MailerSend del tenant
 */
function getMailerSendConfig(tenantId) {
  if (!tenantId) {
    // Fallback a demo config o env global
    const demoKey = process.env.DEMO_MAILERSEND_API_KEY || process.env.MAILERSEND_API_KEY;
    const demoEmail = process.env.DEMO_FROM_EMAIL || process.env.FROM_EMAIL || 'no-reply@demo.local';
    
    if (demoKey && demoKey.startsWith('mlsn.')) {
      return { apiKey: demoKey, fromEmail: demoEmail, isDemo: true };
    }
    
    return { apiKey: null, fromEmail: demoEmail, isDemo: true };
  }
  
  const integrations = getTenantIntegrations(tenantId);
  
  if (!integrations.mailersend_api_key) {
    // Fallback a demo o env global
    const demoKey = process.env.DEMO_MAILERSEND_API_KEY || process.env.MAILERSEND_API_KEY;
    const fromEmail = integrations.from_email || process.env.FROM_EMAIL || 'no-reply@demo.local';
    
    if (demoKey && demoKey.startsWith('mlsn.')) {
      console.warn(`⚠️ Usando MailerSend DEMO/GLOBAL key para tenant ${tenantId}`);
      return { apiKey: demoKey, fromEmail, isDemo: true };
    }
    
    return { apiKey: null, fromEmail, isDemo: true };
  }
  
  const apiKey = decrypt(integrations.mailersend_api_key);
  const fromEmail = integrations.from_email || process.env.FROM_EMAIL || 'no-reply@empresa.com';
  
  return { apiKey, fromEmail, isDemo: false };
}

/**
 * Envía email (o loguea si no hay MailerSend configurado)
 * @param {string} to - Email destinatario
 * @param {string} subject - Asunto
 * @param {string} text - Contenido texto plano
 * @param {string} html - Contenido HTML
 * @param {string} tenantId - ID del tenant (opcional)
 */
async function sendEmail(to, subject, text, html, tenantId = null) {
  const config = getMailerSendConfig(tenantId);
  
  // Si no hay API key, solo loguear
  if (!config.apiKey || !config.apiKey.trim()) {
    console.log('\n📧 EMAIL (simulado, no hay MailerSend configurado):');
    console.log(`   Tenant: ${tenantId || 'N/A'}`);
    console.log(`   Para: ${to}`);
    console.log(`   De: ${config.fromEmail}`);
    console.log(`   Asunto: ${subject}`);
    console.log(`   Contenido:\n${text || html}\n`);
    return { simulated: true };
  }
  
  try {
    // Inicializar MailerSend con la key del tenant
    const mailerSend = new MailerSend({
      apiKey: config.apiKey,
    });
    
    const sentFrom = new Sender(config.fromEmail, process.env.FROM_NAME || 'Whop Recovery');
    const recipients = [new Recipient(to)];
    
    const emailParams = new EmailParams()
      .setFrom(sentFrom)
      .setTo(recipients)
      .setSubject(subject)
      .setHtml(html || text)
      .setText(text || html.replace(/<[^>]*>/g, ''));
    
    await mailerSend.email.send(emailParams);
    console.log(`✅ Email enviado a ${to}${config.isDemo ? ' (DEMO/GLOBAL)' : ''}`);
    return { sent: true, isDemo: config.isDemo };
  } catch (error) {
    console.error('❌ Error enviando email:', error.message);
    // NO lanzar el error, solo loguearlo para que no crashee el servidor
    return { sent: false, error: error.message };
  }
}

/**
 * Envía email de pago fallido inicial
 * @param {string} tenantId - ID del tenant
 */
async function sendPaymentFailedEmail(email, product, amount, retryLink, tenantId = null) {
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
  
  const text = `⚠️ PAGO FALLIDO\n\nTu pago de $${amount} para ${product} no pudo procesarse.\n\nReintenta aquí: ${retryLink}`;
  
  return sendEmail(email, subject, text, html, tenantId);
}

/**
 * Envía email de reintento fallido
 * @param {string} tenantId - ID del tenant
 */
async function sendRetryFailedEmail(email, product, amount, retryCount, retryLink, tenantId = null) {
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
  
  const text = `🔄 REINTENTO FALLIDO\n\nIntento ${retryCount}/3 para ${product} ($${amount}).\n\nReintenta: ${retryLink}`;
  
  return sendEmail(email, subject, text, html, tenantId);
}

/**
 * Envía email de pago recuperado
 * @param {string} tenantId - ID del tenant
 */
async function sendPaymentRecoveredEmail(email, product, amount, tenantId = null) {
  const subject = `✅ Pago exitoso para ${product}`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #059669;">✅ ¡Pago completado!</h2>
      <p>Hola,</p>
      <p>Tu pago de <strong>$${amount}</strong> para <strong>${product}</strong> fue procesado exitosamente.</p>
      <p style="color: #666; font-size: 14px;">Gracias por tu paciencia. ¡Disfruta tu compra!</p>
    </div>
  `;
  
  const text = `✅ ¡PAGO COMPLETADO!\n\nTu pago de $${amount} para ${product} fue procesado exitosamente.`;
  
  return sendEmail(email, subject, text, html, tenantId);
}

/**
 * Envía email de fallo permanente
 * @param {string} tenantId - ID del tenant
 */
async function sendPaymentPermanentFailEmail(email, product, amount, tenantId = null) {
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
  
  const text = `❌ PAGO NO PROCESADO\n\nNo pudimos procesar tu pago de $${amount} para ${product}. Contacta con soporte.`;
  
  return sendEmail(email, subject, text, html, tenantId);
}

module.exports = {
  sendEmail,
  sendPaymentFailedEmail,
  sendRetryFailedEmail,
  sendPaymentRecoveredEmail,
  sendPaymentPermanentFailEmail,
  getMailerSendConfig
};
