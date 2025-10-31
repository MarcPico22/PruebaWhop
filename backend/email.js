const sgMail = require('@sendgrid/mail');

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const FROM_EMAIL = process.env.FROM_EMAIL || 'noreply@whoprecovery.com';
const SUPPORT_EMAIL = process.env.SUPPORT_EMAIL || 'support@whoprecovery.com';

// 1. Email de confirmación de registro
async function sendWelcomeEmail(userEmail, userName) {
  const msg = {
    to: userEmail,
    from: FROM_EMAIL,
    subject: '¡Bienvenido a Whop Recovery! 🎉',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .stats { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>¡Bienvenido a Whop Recovery!</h1>
          </div>
          <div class="content">
            <p>Hola${userName ? ' ' + userName : ''},</p>
            
            <p>¡Gracias por unirte a Whop Recovery! Estamos emocionados de ayudarte a recuperar tus pagos fallidos automáticamente.</p>
            
            <div class="stats">
              <h3>🎯 Qué puedes esperar:</h3>
              <ul>
                <li><strong>85% de tasa de recuperación</strong> - La mayoría de pagos fallidos se recuperan</li>
                <li><strong>100% automático</strong> - Sin intervención manual necesaria</li>
                <li><strong>Dashboard en tiempo real</strong> - Ve exactamente cuánto estás recuperando</li>
              </ul>
            </div>
            
            <h3>📋 Próximos pasos:</h3>
            <ol>
              <li>Conecta tu cuenta de Stripe (toma 2 minutos)</li>
              <li>Configura tus preferencias de reintentos</li>
              <li>¡Empieza a recuperar dinero automáticamente!</li>
            </ol>
            
            <p style="text-align: center;">
              <a href="https://www.whoprecovery.com/dashboard" class="button">Ir al Dashboard →</a>
            </p>
            
            <p>Si tienes alguna pregunta, simplemente responde a este email o contacta a nuestro equipo en <a href="mailto:${SUPPORT_EMAIL}">${SUPPORT_EMAIL}</a></p>
            
            <p>¡Que empiece la recuperación! 🚀</p>
            
            <p>Saludos,<br>El equipo de Whop Recovery</p>
          </div>
          <div class="footer">
            <p>Whop Recovery - Recupera automáticamente tus pagos fallidos</p>
            <p><a href="https://www.whoprecovery.com">whoprecovery.com</a></p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
¡Bienvenido a Whop Recovery!

Hola${userName ? ' ' + userName : ''},

¡Gracias por unirte a Whop Recovery! Estamos emocionados de ayudarte a recuperar tus pagos fallidos automáticamente.

Qué puedes esperar:
- 85% de tasa de recuperación
- 100% automático
- Dashboard en tiempo real

Próximos pasos:
1. Conecta tu cuenta de Stripe
2. Configura tus preferencias de reintentos
3. ¡Empieza a recuperar dinero automáticamente!

Ir al Dashboard: https://www.whoprecovery.com/dashboard

Si tienes alguna pregunta, contacta a ${SUPPORT_EMAIL}

¡Que empiece la recuperación! 🚀

Saludos,
El equipo de Whop Recovery
    `
  };

  try {
    await sgMail.send(msg);
    console.log(`✅ Welcome email sent to ${userEmail}`);
    return { success: true };
  } catch (error) {
    console.error('❌ Error sending welcome email:', error);
    return { success: false, error };
  }
}

// 2. Email de notificación de pago exitoso
async function sendPaymentSuccessEmail(userEmail, userName, amount, plan) {
  const msg = {
    to: userEmail,
    from: FROM_EMAIL,
    subject: '✅ Pago confirmado - Whop Recovery',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #10b981; color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .receipt { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .total { font-size: 24px; font-weight: bold; color: #10b981; text-align: center; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>✅ ¡Pago confirmado!</h1>
          </div>
          <div class="content">
            <p>Hola${userName ? ' ' + userName : ''},</p>
            
            <p>Tu pago se ha procesado correctamente. ¡Gracias por confiar en Whop Recovery!</p>
            
            <div class="receipt">
              <h3>📄 Detalles del pago:</h3>
              <p><strong>Plan:</strong> ${plan.toUpperCase()}</p>
              <p><strong>Monto:</strong> €${amount}</p>
              <p><strong>Fecha:</strong> ${new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
              <p><strong>Estado:</strong> Pagado ✅</p>
            </div>
            
            <div class="total">
              Total: €${amount}
            </div>
            
            <p>Tu suscripción está activa y Whop Recovery ya está trabajando para recuperar tus pagos fallidos automáticamente.</p>
            
            <p>Puedes ver tus estadísticas y configuración en el dashboard:</p>
            <p style="text-align: center;">
              <a href="https://www.whoprecovery.com/dashboard" style="display: inline-block; padding: 12px 30px; background: #10b981; color: white; text-decoration: none; border-radius: 5px;">Ver Dashboard →</a>
            </p>
            
            <p>Si tienes alguna pregunta sobre tu factura, contáctanos en <a href="mailto:${SUPPORT_EMAIL}">${SUPPORT_EMAIL}</a></p>
            
            <p>Saludos,<br>El equipo de Whop Recovery</p>
          </div>
          <div class="footer">
            <p>Whop Recovery - Recupera automáticamente tus pagos fallidos</p>
            <p><a href="https://www.whoprecovery.com">whoprecovery.com</a></p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
¡Pago confirmado!

Hola${userName ? ' ' + userName : ''},

Tu pago se ha procesado correctamente.

Detalles del pago:
- Plan: ${plan.toUpperCase()}
- Monto: €${amount}
- Fecha: ${new Date().toLocaleDateString('es-ES')}
- Estado: Pagado ✅

Total: €${amount}

Ver Dashboard: https://www.whoprecovery.com/dashboard

Contacto: ${SUPPORT_EMAIL}

Saludos,
El equipo de Whop Recovery
    `
  };

  try {
    await sgMail.send(msg);
    console.log(`✅ Payment success email sent to ${userEmail}`);
    return { success: true };
  } catch (error) {
    console.error('❌ Error sending payment email:', error);
    return { success: false, error };
  }
}

// 3. Email de pago fallido (para recuperación de carrito)
async function sendPaymentFailedEmail(userEmail, userName, reason) {
  const msg = {
    to: userEmail,
    from: FROM_EMAIL,
    subject: '⚠️ Problema con tu pago - Whop Recovery',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #f59e0b; color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .alert { background: #fef3c7; padding: 15px; border-left: 4px solid #f59e0b; margin: 20px 0; }
          .button { display: inline-block; padding: 12px 30px; background: #f59e0b; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>⚠️ Problema con tu pago</h1>
          </div>
          <div class="content">
            <p>Hola${userName ? ' ' + userName : ''},</p>
            
            <p>Hemos intentado procesar tu pago pero no pudimos completarlo.</p>
            
            <div class="alert">
              <strong>Motivo:</strong> ${reason || 'Tu método de pago fue rechazado'}
            </div>
            
            <h3>🔧 Cómo solucionarlo:</h3>
            <ol>
              <li>Verifica que tu tarjeta tenga fondos suficientes</li>
              <li>Comprueba que los datos de la tarjeta sean correctos</li>
              <li>Intenta con otro método de pago</li>
            </ol>
            
            <p style="text-align: center;">
              <a href="https://www.whoprecovery.com/dashboard/billing" class="button">Actualizar método de pago →</a>
            </p>
            
            <p><strong>No te preocupes:</strong> Tu cuenta sigue activa por 3 días más mientras resuelves el problema. No perderás ningún dato.</p>
            
            <p>Si necesitas ayuda, estamos aquí: <a href="mailto:${SUPPORT_EMAIL}">${SUPPORT_EMAIL}</a></p>
            
            <p>Saludos,<br>El equipo de Whop Recovery</p>
          </div>
          <div class="footer">
            <p>Whop Recovery - Recupera automáticamente tus pagos fallidos</p>
            <p><a href="https://www.whoprecovery.com">whoprecovery.com</a></p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
Problema con tu pago

Hola${userName ? ' ' + userName : ''},

Hemos intentado procesar tu pago pero no pudimos completarlo.

Motivo: ${reason || 'Tu método de pago fue rechazado'}

Cómo solucionarlo:
1. Verifica que tu tarjeta tenga fondos suficientes
2. Comprueba que los datos sean correctos
3. Intenta con otro método de pago

Actualizar método de pago: https://www.whoprecovery.com/dashboard/billing

No te preocupes: Tu cuenta sigue activa por 3 días más.

Contacto: ${SUPPORT_EMAIL}

Saludos,
El equipo de Whop Recovery
    `
  };

  try {
    await sgMail.send(msg);
    console.log(`✅ Payment failed email sent to ${userEmail}`);
    return { success: true };
  } catch (error) {
    console.error('❌ Error sending payment failed email:', error);
    return { success: false, error };
  }
}

// 4. Email de recuperación exitosa
async function sendRecoverySuccessEmail(userEmail, userName, amount, customerName) {
  const msg = {
    to: userEmail,
    from: FROM_EMAIL,
    subject: '💰 ¡Pago recuperado! - Whop Recovery',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .success { background: #d1fae5; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center; }
          .amount { font-size: 36px; font-weight: bold; color: #10b981; }
          .button { display: inline-block; padding: 12px 30px; background: #10b981; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>💰 ¡Pago recuperado!</h1>
          </div>
          <div class="content">
            <p>Hola${userName ? ' ' + userName : ''},</p>
            
            <p>¡Buenas noticias! Hemos recuperado exitosamente un pago que había fallado.</p>
            
            <div class="success">
              <p><strong>Cliente:</strong> ${customerName}</p>
              <div class="amount">€${amount}</div>
              <p>Recuperado automáticamente ✅</p>
            </div>
            
            <p>Este pago se había marcado como fallido, pero nuestro sistema de reintentos inteligentes lo procesó exitosamente.</p>
            
            <p><strong>Esto es exactamente para lo que Whop Recovery está diseñado</strong> - recuperar ingresos que de otra forma perderías, sin que tengas que hacer nada.</p>
            
            <p style="text-align: center;">
              <a href="https://www.whoprecovery.com/dashboard" class="button">Ver detalles en Dashboard →</a>
            </p>
            
            <p>¿Quieres ver cuánto has recuperado en total? Entra al dashboard y revisa tus estadísticas.</p>
            
            <p>Saludos,<br>El equipo de Whop Recovery</p>
          </div>
          <div class="footer">
            <p>Whop Recovery - Recupera automáticamente tus pagos fallidos</p>
            <p><a href="https://www.whoprecovery.com">whoprecovery.com</a></p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
¡Pago recuperado!

Hola${userName ? ' ' + userName : ''},

¡Buenas noticias! Hemos recuperado exitosamente un pago que había fallado.

Cliente: ${customerName}
Monto: €${amount}
Estado: Recuperado ✅

Ver detalles: https://www.whoprecovery.com/dashboard

Saludos,
El equipo de Whop Recovery
    `
  };

  try {
    await sgMail.send(msg);
    console.log(`✅ Recovery success email sent to ${userEmail}`);
    return { success: true };
  } catch (error) {
    console.error('❌ Error sending recovery email:', error);
    return { success: false, error };
  }
}

module.exports = {
  sendWelcomeEmail,
  sendPaymentSuccessEmail,
  sendPaymentFailedEmail,
  sendRecoverySuccessEmail
};
