const sgMail = require('@sendgrid/mail');

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const FROM_EMAIL = process.env.FROM_EMAIL || 'noreply@whoprecovery.com';
const SUPPORT_EMAIL = process.env.SUPPORT_EMAIL || 'support@whoprecovery.com';
const BASE_URL = process.env.BASE_URL || 'https://www.whoprecovery.com';

// Template base para todos los emails
const getEmailTemplate = (content) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { 
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; 
      line-height: 1.6; 
      color: #333; 
      margin: 0; 
      padding: 0; 
      background-color: #f4f4f7;
    }
    .container { 
      max-width: 600px; 
      margin: 40px auto; 
      background: white;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }
    .header { 
      background: linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%); 
      color: white; 
      padding: 40px 30px; 
      text-align: center;
    }
    .logo {
      width: 64px;
      height: 64px;
      background: white;
      border-radius: 12px;
      margin: 0 auto 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 32px;
      font-weight: bold;
      color: #4F46E5;
    }
    .header h1 { 
      margin: 0; 
      font-size: 24px; 
      font-weight: 600;
    }
    .content { 
      padding: 40px 30px; 
    }
    .button { 
      display: inline-block; 
      padding: 14px 32px; 
      background: #4F46E5; 
      color: white !important; 
      text-decoration: none; 
      border-radius: 6px; 
      margin: 20px 0;
      font-weight: 600;
      transition: background 0.3s;
    }
    .button:hover {
      background: #4338CA;
    }
    .stats { 
      background: #F9FAFB; 
      padding: 24px; 
      border-radius: 8px; 
      margin: 24px 0;
      border-left: 4px solid #4F46E5;
    }
    .footer { 
      background: #F9FAFB;
      padding: 30px; 
      text-align: center; 
      color: #6B7280; 
      font-size: 13px;
      border-top: 1px solid #E5E7EB;
    }
    .footer a {
      color: #4F46E5;
      text-decoration: none;
    }
    .footer-links {
      margin: 20px 0;
    }
    .footer-links a {
      margin: 0 10px;
      color: #6B7280;
    }
    @media only screen and (max-width: 600px) {
      .container { margin: 20px; }
      .header, .content, .footer { padding: 20px; }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">€</div>
      <h1>Whop Recovery</h1>
    </div>
    <div class="content">
      ${content}
    </div>
    <div class="footer">
      <p><strong>Whop Recovery</strong> - Recupera automáticamente tus pagos fallidos</p>
      <p style="color: #9CA3AF; font-size: 12px;">
        © 2025 Guirigall - Palma de Mallorca, España
      </p>
      <div class="footer-links">
        <a href="${BASE_URL}/terminos">Términos de Servicio</a> •
        <a href="${BASE_URL}/privacidad">Política de Privacidad</a> •
        <a href="${BASE_URL}">Visitar Web</a>
      </div>
      <p style="color: #9CA3AF; font-size: 11px; margin-top: 20px;">
        Si no solicitaste este email, puedes ignorarlo de forma segura.<br>
        Para darte de baja, <a href="${BASE_URL}/unsubscribe">haz clic aquí</a>.
      </p>
    </div>
  </div>
</body>
</html>
`;

//1. Email de confirmación de registro
async function sendWelcomeEmail(userEmail, userName) {
  const content = `
    <p>Hola${userName ? ' <strong>' + userName + '</strong>' : ''},</p>
    
    <p>¡Gracias por unirte a Whop Recovery! Estamos emocionados de ayudarte a recuperar tus pagos fallidos automáticamente.</p>
    
    <div class="stats">
      <h3 style="margin-top: 0;">🎯 Qué puedes esperar:</h3>
      <ul style="margin: 0; padding-left: 20px;">
        <li><strong>85% de tasa de recuperación</strong> - La mayoría de pagos fallidos se recuperan</li>
        <li><strong>100% automático</strong> - Sin intervención manual necesaria</li>
        <li><strong>Dashboard en tiempo real</strong> - Ve exactamente cuánto estás recuperando</li>
      </ul>
    </div>
    
    <h3>📋 Próximos pasos:</h3>
    <ol>
      <li>Conecta tu cuenta de Whop/Stripe (toma 2 minutos)</li>
      <li>Configura tus preferencias de reintentos</li>
      <li>¡Empieza a recuperar dinero automáticamente!</li>
    </ol>
    
    <p style="text-align: center;">
      <a href="${BASE_URL}/dashboard" class="button">Ir al Dashboard →</a>
    </p>
    
    <p>Si tienes alguna pregunta, simplemente responde a este email o contacta a nuestro equipo en <a href="mailto:${SUPPORT_EMAIL}">${SUPPORT_EMAIL}</a></p>
    
    <p>¡Que empiece la recuperación! 🚀</p>
    
    <p>Saludos,<br><strong>El equipo de Whop Recovery</strong></p>
  `;

  const msg = {
    to: userEmail,
    from: FROM_EMAIL,
    subject: '¡Bienvenido a Whop Recovery! 🎉',
    html: getEmailTemplate(content),
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

/**
 * Send onboarding email sequence
 */
async function sendOnboardingDay0Email(userEmail, userName) {
  const msg = {
    to: userEmail,
    from: FROM_EMAIL,
    subject: '¡Bienvenido a Whop Recovery! 🎉',
    html: getEmailTemplate(`
      <h2>¡Hola${userName ? ' ' + userName : ''}! 👋</h2>
      
      <p>Bienvenido a <strong>Whop Recovery</strong>. Estamos encantados de tenerte con nosotros.</p>
      
      <p>Durante los próximos <strong>14 días de prueba gratuita</strong>, podrás recuperar automáticamente hasta <strong>50 pagos fallidos</strong>.</p>
      
      <div class="stats">
        <h3 style="margin-top: 0;">📋 Checklist de Configuración</h3>
        <p>Para empezar a recuperar pagos, necesitas completar estos 3 pasos:</p>
        <ol>
          <li><strong>Conecta tu API de Whop</strong> - Para detectar pagos fallidos</li>
          <li><strong>Configura SendGrid</strong> - Para enviar emails de recuperación</li>
          <li><strong>Crea tu primer reintento</strong> - Automatiza la recuperación</li>
        </ol>
      </div>
      
      <p style="text-align: center;">
        <a href="${BASE_URL}/dashboard" class="button">Completar configuración →</a>
      </p>
      
      <p><strong>💡 Tip:</strong> La mayoría de nuestros usuarios recuperan su primer pago en las primeras 24 horas.</p>
      
      <p>Si necesitas ayuda, responde a este email. Estamos aquí para ayudarte.</p>
      
      <p>Saludos,<br>El equipo de Whop Recovery</p>
    `),
    text: `
¡Bienvenido a Whop Recovery!

Hola${userName ? ' ' + userName : ''},

Durante los próximos 14 días de prueba gratuita, podrás recuperar automáticamente hasta 50 pagos fallidos.

Checklist de Configuración:
1. Conecta tu API de Whop
2. Configura SendGrid
3. Crea tu primer reintento

Completa la configuración: ${BASE_URL}/dashboard

Saludos,
El equipo de Whop Recovery
    `
  };

  try {
    await sgMail.send(msg);
    console.log(`✅ Onboarding Day 0 email sent to ${userEmail}`);
    return { success: true };
  } catch (error) {
    console.error('❌ Error sending onboarding email:', error);
    return { success: false, error };
  }
}

async function sendOnboardingDay3Email(userEmail, userName) {
  const msg = {
    to: userEmail,
    from: FROM_EMAIL,
    subject: '💪 Tips para recuperar más pagos - Día 3',
    html: getEmailTemplate(`
      <h2>Hola${userName ? ' ' + userName : ''},</h2>
      
      <p>Han pasado 3 días desde que te uniste a Whop Recovery. ¿Cómo va todo?</p>
      
      <div class="stats">
        <h3 style="margin-top: 0;">🎯 Caso de Éxito</h3>
        <p><strong>TradingPro Community</strong> recuperó <strong>€2,847</strong> en su primer mes usando Whop Recovery.</p>
        <p style="font-size: 14px; color: #6B7280; margin-top: 10px;">
          "Antes perdíamos 20-30% de renovaciones por tarjetas caducadas. Ahora recuperamos casi todas." - Marco R.
        </p>
      </div>
      
      <p><strong>💡 3 Tips para maximizar recuperaciones:</strong></p>
      
      <ol>
        <li><strong>Reintentos múltiples</strong> - Configura 3 intentos: 1h, 24h, 72h después del fallo</li>
        <li><strong>Emails personalizados</strong> - Mensajes amigables tienen 2x más conversión</li>
        <li><strong>Horarios óptimos</strong> - Reintentar entre 10am-2pm tiene mejores resultados</li>
      </ol>
      
      <p style="text-align: center;">
        <a href="${BASE_URL}/dashboard" class="button">Ver mi dashboard →</a>
      </p>
      
      <p>¿Tienes alguna pregunta? Responde a este email, estamos aquí para ayudar.</p>
      
      <p>Saludos,<br>El equipo de Whop Recovery</p>
    `),
    text: `
Tips para recuperar más pagos - Día 3

Hola${userName ? ' ' + userName : ''},

Caso de Éxito:
TradingPro Community recuperó €2,847 en su primer mes.

3 Tips:
1. Reintentos múltiples (1h, 24h, 72h)
2. Emails personalizados
3. Horarios óptimos (10am-2pm)

Ver dashboard: ${BASE_URL}/dashboard

Saludos,
El equipo de Whop Recovery
    `
  };

  try {
    await sgMail.send(msg);
    console.log(`✅ Onboarding Day 3 email sent to ${userEmail}`);
    return { success: true };
  } catch (error) {
    console.error('❌ Error sending day 3 email:', error);
    return { success: false, error };
  }
}

async function sendOnboardingDay7Email(userEmail, userName, hasRecoveredPayments = false) {
  const msg = {
    to: userEmail,
    from: FROM_EMAIL,
    subject: '⏰ Tu trial termina en 7 días',
    html: getEmailTemplate(`
      <h2>Hola${userName ? ' ' + userName : ''},</h2>
      
      <p>Tu trial de 14 días con Whop Recovery termina en <strong>7 días</strong>.</p>
      
      ${hasRecoveredPayments ? `
        <div class="stats">
          <p style="font-size: 18px; margin: 0; color: #059669;">
            ✅ Ya has recuperado pagos con Whop Recovery
          </p>
        </div>
        
        <p>¡Genial! Has visto el valor de recuperar pagos automáticamente.</p>
        
        <p><strong>Para seguir recuperando después del trial:</strong></p>
        <ul>
          <li>🟢 <strong>Plan PRO</strong> - €49/mes - 500 pagos/mes</li>
          <li>🔵 <strong>Plan ENTERPRISE</strong> - €199/mes - Ilimitado</li>
        </ul>
      ` : `
        <p>Notamos que aún no has configurado completamente Whop Recovery.</p>
        
        <p><strong>Recuerda:</strong> Necesitas conectar tu API de Whop y configurar SendGrid para empezar a recuperar pagos.</p>
        
        <p style="text-align: center;">
          <a href="${BASE_URL}/dashboard/settings" class="button">Completar configuración →</a>
        </p>
      `}
      
      <p>¿Necesitas ayuda con algo? Responde a este email o agenda una llamada de 15min: <a href="mailto:${SUPPORT_EMAIL}">${SUPPORT_EMAIL}</a></p>
      
      <p>Saludos,<br>El equipo de Whop Recovery</p>
    `),
    text: `
Tu trial termina en 7 días

Hola${userName ? ' ' + userName : ''},

Tu trial de 14 días termina pronto.

${hasRecoveredPayments ? 
  'Plan PRO: €49/mes - 500 pagos\nPlan ENTERPRISE: €199/mes - Ilimitado' :
  'Completa tu configuración: ' + BASE_URL + '/dashboard/settings'
}

Necesitas ayuda? ${SUPPORT_EMAIL}

Saludos,
El equipo de Whop Recovery
    `
  };

  try {
    await sgMail.send(msg);
    console.log(`✅ Onboarding Day 7 email sent to ${userEmail}`);
    return { success: true };
  } catch (error) {
    console.error('❌ Error sending day 7 email:', error);
    return { success: false, error };
  }
}

/**
 * Schedule onboarding emails (call this when user registers)
 */
function scheduleOnboardingEmails(userEmail, userName) {
  // Day 0: Immediate welcome
  sendOnboardingDay0Email(userEmail, userName);
  
  // Day 3: Tips (scheduled)
  setTimeout(() => {
    sendOnboardingDay3Email(userEmail, userName);
  }, 3 * 24 * 60 * 60 * 1000); // 3 días
  
  // Day 7: Trial reminder (scheduled)
  setTimeout(() => {
    sendOnboardingDay7Email(userEmail, userName);
  }, 7 * 24 * 60 * 60 * 1000); // 7 días
  
  console.log(`📧 Onboarding emails scheduled for ${userEmail}`);
}

module.exports = {
  sendWelcomeEmail,
  sendPaymentSuccessEmail,
  sendPaymentFailedEmail,
  sendRecoverySuccessEmail,
  sendOnboardingDay0Email,
  sendOnboardingDay3Email,
  sendOnboardingDay7Email,
  scheduleOnboardingEmails
};
