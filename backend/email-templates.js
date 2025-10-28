/**
 * 📧 Email Templates para Sistema de Notificaciones
 * Soporte para variables dinámicas y HTML profesional
 */

/**
 * Template: Pago Recuperado ✅
 */
function paymentRecoveredTemplate(data) {
  const { 
    companyName, 
    customerEmail, 
    product, 
    amount, 
    retries, 
    recoveryMethod 
  } = data;

  return {
    subject: `✅ Pago recuperado: $${amount} de ${customerEmail}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Pago Recuperado</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f3f4f6;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 40px 20px;">
          <tr>
            <td align="center">
              <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                
                <!-- Header con gradiente -->
                <tr>
                  <td style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 40px 30px; text-align: center;">
                    <div style="font-size: 48px; margin-bottom: 10px;">✅</div>
                    <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">
                      ¡Pago Recuperado!
                    </h1>
                    <p style="margin: 10px 0 0 0; color: rgba(255, 255, 255, 0.9); font-size: 16px;">
                      ${companyName}
                    </p>
                  </td>
                </tr>
                
                <!-- Contenido principal -->
                <tr>
                  <td style="padding: 40px 30px;">
                    
                    <p style="font-size: 16px; color: #374151; margin: 0 0 30px 0; line-height: 1.6;">
                      Buenas noticias: hemos recuperado exitosamente un pago que estaba pendiente.
                    </p>
                    
                    <!-- Card de detalles -->
                    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; border-radius: 12px; padding: 20px; margin-bottom: 30px;">
                      <tr>
                        <td>
                          <h2 style="margin: 0 0 20px 0; font-size: 18px; color: #111827; font-weight: 600;">
                            📊 Detalles del Pago
                          </h2>
                          
                          <table width="100%" cellpadding="8" cellspacing="0">
                            <tr>
                              <td style="color: #6b7280; font-size: 14px; font-weight: 500;">Cliente:</td>
                              <td style="color: #111827; font-size: 14px; font-weight: 600; text-align: right;">${customerEmail}</td>
                            </tr>
                            <tr>
                              <td style="color: #6b7280; font-size: 14px; font-weight: 500;">Producto:</td>
                              <td style="color: #111827; font-size: 14px; font-weight: 600; text-align: right;">${product}</td>
                            </tr>
                            <tr>
                              <td style="color: #6b7280; font-size: 14px; font-weight: 500;">Monto:</td>
                              <td style="color: #10b981; font-size: 20px; font-weight: 700; text-align: right;">$${amount}</td>
                            </tr>
                            <tr>
                              <td style="color: #6b7280; font-size: 14px; font-weight: 500;">Intentos:</td>
                              <td style="color: #111827; font-size: 14px; font-weight: 600; text-align: right;">${retries}</td>
                            </tr>
                            <tr>
                              <td style="color: #6b7280; font-size: 14px; font-weight: 500;">Método:</td>
                              <td style="color: #111827; font-size: 14px; font-weight: 600; text-align: right;">${recoveryMethod}</td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                    
                    <!-- CTA Button -->
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td align="center" style="padding: 20px 0;">
                          <a href="http://localhost:3000/dashboard" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 10px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);">
                            Ver Dashboard
                          </a>
                        </td>
                      </tr>
                    </table>
                    
                  </td>
                </tr>
                
                <!-- Footer -->
                <tr>
                  <td style="background-color: #f9fafb; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb;">
                    <p style="margin: 0 0 10px 0; color: #6b7280; font-size: 14px;">
                      Esta notificación fue enviada automáticamente por el sistema de recuperación de pagos.
                    </p>
                    <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                      Whop Retry - Sistema de Recuperación de Pagos
                    </p>
                  </td>
                </tr>
                
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `,
    text: `
✅ PAGO RECUPERADO

${companyName}

Hemos recuperado exitosamente un pago pendiente:

Cliente: ${customerEmail}
Producto: ${product}
Monto: $${amount}
Intentos: ${retries}
Método: ${recoveryMethod}

Ve los detalles en: http://localhost:3000/dashboard

---
Whop Retry - Sistema de Recuperación de Pagos
    `.trim()
  };
}

/**
 * Template: Resumen Diario 📊
 */
function dailySummaryTemplate(data) {
  const {
    companyName,
    date,
    totalRecovered,
    paymentsRecovered,
    pendingPayments,
    totalPending,
    recoveryRate
  } = data;

  const paymentsRows = paymentsRecovered.map(p => `
    <tr style="border-bottom: 1px solid #e5e7eb;">
      <td style="padding: 12px 8px; color: #374151; font-size: 14px;">${p.email}</td>
      <td style="padding: 12px 8px; color: #374151; font-size: 14px;">${p.product}</td>
      <td style="padding: 12px 8px; color: #10b981; font-size: 14px; font-weight: 600; text-align: right;">$${p.amount}</td>
    </tr>
  `).join('');

  return {
    subject: `📊 Resumen diario: ${paymentsRecovered.length} pagos recuperados ($${totalRecovered})`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f3f4f6;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 40px 20px;">
          <tr>
            <td align="center">
              <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                
                <!-- Header -->
                <tr>
                  <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center;">
                    <div style="font-size: 48px; margin-bottom: 10px;">📊</div>
                    <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">
                      Resumen Diario
                    </h1>
                    <p style="margin: 10px 0 0 0; color: rgba(255, 255, 255, 0.9); font-size: 16px;">
                      ${date} - ${companyName}
                    </p>
                  </td>
                </tr>
                
                <!-- Stats Cards -->
                <tr>
                  <td style="padding: 40px 30px 20px 30px;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td width="33%" style="padding: 0 10px 0 0;">
                          <div style="background-color: #f0fdf4; border-left: 4px solid #10b981; padding: 20px; border-radius: 8px;">
                            <div style="color: #059669; font-size: 12px; font-weight: 600; text-transform: uppercase; margin-bottom: 8px;">Recuperado</div>
                            <div style="color: #111827; font-size: 24px; font-weight: 700;">$${totalRecovered}</div>
                          </div>
                        </td>
                        <td width="33%" style="padding: 0 5px;">
                          <div style="background-color: #eff6ff; border-left: 4px solid #3b82f6; padding: 20px; border-radius: 8px;">
                            <div style="color: #1d4ed8; font-size: 12px; font-weight: 600; text-transform: uppercase; margin-bottom: 8px;">Pagos</div>
                            <div style="color: #111827; font-size: 24px; font-weight: 700;">${paymentsRecovered.length}</div>
                          </div>
                        </td>
                        <td width="33%" style="padding: 0 0 0 10px;">
                          <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 20px; border-radius: 8px;">
                            <div style="color: #d97706; font-size: 12px; font-weight: 600; text-transform: uppercase; margin-bottom: 8px;">Tasa</div>
                            <div style="color: #111827; font-size: 24px; font-weight: 700;">${recoveryRate}%</div>
                          </div>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                
                <!-- Tabla de pagos -->
                ${paymentsRecovered.length > 0 ? `
                <tr>
                  <td style="padding: 0 30px 40px 30px;">
                    <h2 style="margin: 0 0 20px 0; font-size: 18px; color: #111827; font-weight: 600;">
                      Pagos Recuperados Hoy
                    </h2>
                    <table width="100%" cellpadding="0" cellspacing="0" style="border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
                      <thead>
                        <tr style="background-color: #f9fafb;">
                          <th style="padding: 12px 8px; text-align: left; color: #6b7280; font-size: 12px; font-weight: 600; text-transform: uppercase;">Cliente</th>
                          <th style="padding: 12px 8px; text-align: left; color: #6b7280; font-size: 12px; font-weight: 600; text-transform: uppercase;">Producto</th>
                          <th style="padding: 12px 8px; text-align: right; color: #6b7280; font-size: 12px; font-weight: 600; text-transform: uppercase;">Monto</th>
                        </tr>
                      </thead>
                      <tbody>
                        ${paymentsRows}
                      </tbody>
                    </table>
                  </td>
                </tr>
                ` : ''}
                
                <!-- Pendientes -->
                ${pendingPayments > 0 ? `
                <tr>
                  <td style="padding: 0 30px 40px 30px;">
                    <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 20px; border-radius: 8px;">
                      <div style="color: #92400e; font-size: 14px; font-weight: 600; margin-bottom: 5px;">
                        ⏳ ${pendingPayments} pagos pendientes
                      </div>
                      <div style="color: #78350f; font-size: 12px;">
                        Total en riesgo: $${totalPending}
                      </div>
                    </div>
                  </td>
                </tr>
                ` : ''}
                
                <!-- Footer -->
                <tr>
                  <td style="background-color: #f9fafb; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb;">
                    <p style="margin: 0 0 10px 0; color: #6b7280; font-size: 14px;">
                      Resumen enviado automáticamente cada 24 horas.
                    </p>
                    <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                      Whop Retry - Sistema de Recuperación de Pagos
                    </p>
                  </td>
                </tr>
                
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `,
    text: `
📊 RESUMEN DIARIO - ${date}

${companyName}

RECUPERADO HOY: $${totalRecovered}
PAGOS RECUPERADOS: ${paymentsRecovered.length}
TASA DE RECUPERACIÓN: ${recoveryRate}%

${paymentsRecovered.length > 0 ? `
PAGOS RECUPERADOS:
${paymentsRecovered.map(p => `- ${p.email}: ${p.product} ($${p.amount})`).join('\n')}
` : ''}

${pendingPayments > 0 ? `
PENDIENTES: ${pendingPayments} pagos ($${totalPending})
` : ''}

---
Whop Retry - Sistema de Recuperación de Pagos
    `.trim()
  };
}

/**
 * Template: Alerta de Umbral 🚨
 */
function thresholdAlertTemplate(data) {
  const {
    companyName,
    pendingPayments,
    totalPending,
    threshold,
    oldestPayment
  } = data;

  return {
    subject: `🚨 Alerta: ${pendingPayments} pagos pendientes ($${totalPending})`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f3f4f6;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 40px 20px;">
          <tr>
            <td align="center">
              <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                
                <!-- Header -->
                <tr>
                  <td style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); padding: 40px 30px; text-align: center;">
                    <div style="font-size: 48px; margin-bottom: 10px;">🚨</div>
                    <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">
                      Alerta de Pagos Pendientes
                    </h1>
                    <p style="margin: 10px 0 0 0; color: rgba(255, 255, 255, 0.9); font-size: 16px;">
                      ${companyName}
                    </p>
                  </td>
                </tr>
                
                <!-- Contenido -->
                <tr>
                  <td style="padding: 40px 30px;">
                    
                    <div style="background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 20px; border-radius: 8px; margin-bottom: 30px;">
                      <p style="margin: 0; color: #991b1b; font-size: 16px; font-weight: 600;">
                        Has alcanzado el umbral de ${threshold} pagos pendientes.
                      </p>
                    </div>
                    
                    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 30px;">
                      <tr>
                        <td width="50%" style="padding-right: 10px;">
                          <div style="background-color: #fef3c7; padding: 20px; border-radius: 8px; text-align: center;">
                            <div style="color: #92400e; font-size: 14px; font-weight: 600; margin-bottom: 8px;">Pagos Pendientes</div>
                            <div style="color: #78350f; font-size: 32px; font-weight: 700;">${pendingPayments}</div>
                          </div>
                        </td>
                        <td width="50%" style="padding-left: 10px;">
                          <div style="background-color: #fee2e2; padding: 20px; border-radius: 8px; text-align: center;">
                            <div style="color: #991b1b; font-size: 14px; font-weight: 600; margin-bottom: 8px;">Total en Riesgo</div>
                            <div style="color: #7f1d1d; font-size: 32px; font-weight: 700;">$${totalPending}</div>
                          </div>
                        </td>
                      </tr>
                    </table>
                    
                    ${oldestPayment ? `
                    <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin-bottom: 30px;">
                      <div style="color: #6b7280; font-size: 12px; font-weight: 600; text-transform: uppercase; margin-bottom: 10px;">
                        Pago más antiguo
                      </div>
                      <div style="color: #111827; font-size: 14px; margin-bottom: 5px;">
                        <strong>${oldestPayment.email}</strong> - ${oldestPayment.product}
                      </div>
                      <div style="color: #6b7280; font-size: 14px;">
                        Monto: $${oldestPayment.amount} | Creado hace ${oldestPayment.daysAgo} días
                      </div>
                    </div>
                    ` : ''}
                    
                    <p style="color: #374151; font-size: 14px; line-height: 1.6; margin: 0 0 30px 0;">
                      <strong>Acciones recomendadas:</strong><br>
                      • Revisar configuración de reintentos<br>
                      • Verificar que los webhooks funcionen correctamente<br>
                      • Contactar manualmente con los clientes si es necesario
                    </p>
                    
                    <!-- CTA -->
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td align="center">
                          <a href="http://localhost:3000/dashboard?filter=pending" style="display: inline-block; background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 10px; font-weight: 600; font-size: 16px;">
                            Ver Pagos Pendientes
                          </a>
                        </td>
                      </tr>
                    </table>
                    
                  </td>
                </tr>
                
                <!-- Footer -->
                <tr>
                  <td style="background-color: #f9fafb; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb;">
                    <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                      Puedes configurar el umbral de alertas en la configuración del dashboard.
                    </p>
                  </td>
                </tr>
                
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `,
    text: `
🚨 ALERTA DE PAGOS PENDIENTES

${companyName}

Has alcanzado el umbral de ${threshold} pagos pendientes.

PAGOS PENDIENTES: ${pendingPayments}
TOTAL EN RIESGO: $${totalPending}

${oldestPayment ? `
PAGO MÁS ANTIGUO:
${oldestPayment.email} - ${oldestPayment.product}
$${oldestPayment.amount} (hace ${oldestPayment.daysAgo} días)
` : ''}

ACCIONES RECOMENDADAS:
- Revisar configuración de reintentos
- Verificar webhooks
- Contactar clientes manualmente si es necesario

Ver todos los pagos pendientes en:
http://localhost:3000/dashboard?filter=pending

---
Whop Retry - Sistema de Recuperación de Pagos
    `.trim()
  };
}

module.exports = {
  paymentRecoveredTemplate,
  dailySummaryTemplate,
  thresholdAlertTemplate
};
