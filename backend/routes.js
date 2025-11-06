const express = require('express');
const { v4: uuidv4 } = require('uuid');
const {
  db,
  insertPayment,
  getPayments,
  getPaymentById,
  getPaymentByToken,
  getStats,
  getConfig,
  updateMultipleConfig,
  updatePaymentStatus,
  getNotificationSettings,
  updateNotificationSettings,
  getTenantIntegrations,
  updateTenantIntegrations,
  getSubscription,
  updateSubscription
} = require('./db');
const { sendPaymentFailedEmail } = require('./mailer');
const { 
  sendWelcomeEmail, 
  sendPaymentSuccessEmail, 
  sendPaymentFailedEmail: sendPaymentFailedEmailSG, 
  sendRecoverySuccessEmail,
  scheduleOnboardingEmails
} = require('./email');
const { processRetry } = require('./retry-logic');
const { register, login, authenticateToken } = require('./auth');
const { 
  createCheckoutSession, 
  verifyWebhookSignature, 
  handleWebhookEvent 
} = require('./stripe-service');
const { sendPaymentRecoveredNotification } = require('./notification-service');
const { 
  encrypt, 
  decrypt, 
  maskApiKey, 
  validateStripeKey
} = require('./encryption');
const { getAllPlans, getPlan, getUsagePercentage, shouldShowLimitWarning } = require('./plans');
const { 
  checkPlanLimits, 
  trackPaymentUsage, 
  attachSubscription,
  checkPlanLimitsWebhook,
  trackPaymentUsageWebhook
} = require('./subscription-middleware');
const {
  checkAndUnlockAchievements,
  getUserAchievements,
  getBadgeProgress
} = require('./achievements');
const {
  syncFailedPayments,
  validateWhopApiKey,
  processWhopWebhook
} = require('./whop-service');
const {
  createCheckoutSession: createBillingCheckout,
  createPortalSession,
  verifyWebhook,
  handleBillingWebhook
} = require('./billing-service');

const router = express.Router();

/**
 * POST /api/auth/register - Registrar nuevo usuario
 */
router.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, company_name } = req.body;
    
    if (!email || !password || !company_name) {
      return res.status(400).json({ error: 'Todos los campos son requeridos' });
    }
    
    if (password.length < 6) {
      return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres' });
    }
    
    const user = await register(email, password, company_name);
    
    // Enviar secuencia de emails de onboarding
    try {
      scheduleOnboardingEmails(email, company_name);
      console.log(`✅ Onboarding emails scheduled for ${email}`);
    } catch (emailError) {
      console.error('❌ Error scheduling onboarding emails:', emailError);
      // No fallar el registro si el email falla
    }
    
    res.status(201).json({ 
      success: true, 
      message: 'Usuario registrado exitosamente',
      user 
    });
  } catch (error) {
    if (error.message === 'El email ya está registrado') {
      return res.status(409).json({ error: error.message });
    }
    console.error('❌ Error en registro:', error);
    res.status(500).json({ error: 'Error al registrar usuario' });
  }
});

/**
 * POST /api/auth/login - Iniciar sesión
 */
router.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email y contraseña son requeridos' });
    }
    
    const result = await login(email, password);
    
    res.json({ 
      success: true,
      ...result 
    });
  } catch (error) {
    if (error.message === 'Credenciales inválidas') {
      return res.status(401).json({ error: error.message });
    }
    console.error('❌ Error en login:', error);
    res.status(500).json({ error: 'Error al iniciar sesión' });
  }
});

/**
 * GET /api/auth/me - Obtener usuario actual (protegida)
 */
router.get('/api/auth/me', authenticateToken, (req, res) => {
  try {
    // Obtener datos completos del usuario desde la DB
    const { getUserByEmail } = require('./db');
    const user = getUserByEmail(req.user.email);
    
    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    
    // Retornar sin password
    const { password, ...userWithoutPassword } = user;
    res.json({ user: userWithoutPassword });
  } catch (error) {
    console.error('❌ Error obteniendo usuario:', error);
    res.status(500).json({ error: 'Error obteniendo información del usuario' });
  }
});

/**
 * Webhook de Whop - recibe notificación de pago fallido
 * NOTA: El webhook debe incluir tenant_id en el body para asociar el pago a una empresa
 */
router.post('/webhook/whop', checkPlanLimitsWebhook, async (req, res) => {
  try {
    const { event, data, tenant_id } = req.body;
    
    // Validar evento
    if (event !== 'payment_failed') {
      return res.status(200).json({ message: 'Evento ignorado' });
    }
    
    // Validar datos requeridos
    if (!data || !data.id || !data.email || !data.product || !data.amount) {
      return res.status(400).json({ error: 'Datos incompletos en webhook' });
    }
    
    // Validar tenant_id (requerido para multi-tenancy)
    if (!tenant_id) {
      return res.status(400).json({ error: 'tenant_id es requerido en el webhook' });
    }
    
    // Generar token único y retry link
    const token = uuidv4();
    const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
    const retryLink = `${baseUrl}/retry/${token}`;
    
    // Guardar pago en DB con tenant_id
    const payment = {
      id: data.id,
      email: data.email,
      product: data.product,
      amount: data.amount,
      status: 'pending',
      retries: 0,
      token,
      retry_link: retryLink,
      tenant_id: tenant_id
    };
    
    insertPayment(payment);
    
    // Incrementar contador de pagos usados
    trackPaymentUsageWebhook(req, res, () => {});
    
    // Enviar email inicial
    await sendPaymentFailedEmail(data.email, data.product, data.amount, retryLink, tenant_id);
    
    console.log(`✅ Webhook procesado: pago ${data.id} registrado como fallido`);
    
    res.status(200).json({ 
      success: true, 
      message: 'Pago fallido registrado',
      retry_link: retryLink
    });
    
  } catch (error) {
    console.error('❌ Error procesando webhook:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

/**
 * GET /api/payments - Listar todos los pagos (con filtro opcional) - PROTEGIDA
 */
router.get('/api/payments', authenticateToken, (req, res) => {
  try {
    const { status } = req.query;
    const tenantId = req.user.tenantId; // Del JWT
    
    const payments = getPayments(tenantId, status);
    const stats = getStats(tenantId);
    
    res.json({ payments, stats });
  } catch (error) {
    console.error('❌ Error obteniendo pagos:', error);
    res.status(500).json({ error: 'Error obteniendo pagos' });
  }
});

/**
 * POST /api/payments/:id/retry - Forzar reintento manual - PROTEGIDA
 */
router.post('/api/payments/:id/retry', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const tenantId = req.user.tenantId;
    const payment = getPaymentById(id, tenantId);
    
    if (!payment) {
      return res.status(404).json({ error: 'Pago no encontrado' });
    }
    
    if (payment.status === 'recovered') {
      return res.status(400).json({ error: 'Pago ya recuperado' });
    }
    
    if (payment.status === 'failed-permanent') {
      return res.status(400).json({ error: 'Pago marcado como fallo permanente' });
    }
    
    // Procesar reintento
    const result = await processRetry(payment);
    
    res.json({ 
      success: true, 
      result,
      message: result.success ? 'Pago recuperado exitosamente' : 'Intento fallido'
    });
    
  } catch (error) {
    console.error('❌ Error procesando reintento:', error);
    res.status(500).json({ error: 'Error procesando reintento' });
  }
});

/**
 * GET /retry/:token - Página pública para reintento
 */
router.get('/retry/:token', (req, res) => {
  try {
    const { token } = req.params;
    const payment = getPaymentByToken(token);
    
    if (!payment) {
      return res.status(404).send(`
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <title>Link inválido</title>
          <style>
            body { font-family: Arial, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px; text-align: center; }
            .error { color: #DC2626; }
          </style>
        </head>
        <body>
          <h1 class="error">❌ Link inválido</h1>
          <p>Este link de reintento no existe o ha expirado.</p>
        </body>
        </html>
      `);
    }
    
    // Página HTML mejorada con UI tipo Stripe
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Reintentar pago - ${payment.product}</title>
        <style>
          * { box-sizing: border-box; }
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
            max-width: 480px;
            margin: 0 auto;
            padding: 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .container {
            width: 100%;
          }
          .card {
            background: white;
            border-radius: 16px;
            padding: 32px;
            box-shadow: 0 10px 40px rgba(0,0,0,0.1);
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
          }
          h1 { 
            color: #1a202c; 
            margin: 0 0 8px 0; 
            font-size: 24px;
          }
          .subtitle {
            color: #718096;
            font-size: 14px;
          }
          .product-info {
            background: #f7fafc;
            border-radius: 12px;
            padding: 20px;
            margin-bottom: 24px;
          }
          .product-name { 
            font-size: 18px; 
            font-weight: 600; 
            color: #2d3748; 
            margin-bottom: 8px;
          }
          .amount { 
            font-size: 36px; 
            font-weight: bold; 
            color: #667eea; 
            margin-bottom: 12px;
          }
          .status-badge {
            display: inline-block;
            padding: 6px 14px;
            border-radius: 20px;
            font-size: 13px;
            font-weight: 600;
          }
          .status-pending { background: #fef3c7; color: #92400e; }
          .status-recovered { background: #d1fae5; color: #065f46; }
          .status-failed { background: #fee2e2; color: #991b1b; }
          
          .payment-form {
            margin-top: 24px;
          }
          .form-group {
            margin-bottom: 16px;
          }
          label {
            display: block;
            color: #4a5568;
            font-size: 13px;
            font-weight: 500;
            margin-bottom: 6px;
          }
          input {
            width: 100%;
            padding: 12px 14px;
            border: 2px solid #e2e8f0;
            border-radius: 8px;
            font-size: 15px;
            transition: border-color 0.2s;
          }
          input:focus {
            outline: none;
            border-color: #667eea;
          }
          .card-row {
            display: grid;
            grid-template-columns: 2fr 1fr 1fr;
            gap: 12px;
          }
          
          .btn-primary {
            width: 100%;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 16px;
            border: none;
            border-radius: 10px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            transition: transform 0.2s, box-shadow 0.2s;
            box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
          }
          .btn-primary:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(102, 126, 234, 0.5);
          }
          .btn-primary:disabled {
            background: #cbd5e0;
            cursor: not-allowed;
            transform: none;
            box-shadow: none;
          }
          
          .message {
            margin-top: 20px;
            padding: 16px;
            border-radius: 10px;
            font-size: 14px;
            font-weight: 500;
            display: none;
          }
          .message.success { 
            background: #d1fae5; 
            color: #065f46; 
            display: block; 
          }
          .message.error { 
            background: #fee2e2; 
            color: #991b1b; 
            display: block; 
          }
          
          .info-row {
            display: flex;
            justify-content: space-between;
            color: #718096;
            font-size: 13px;
            margin-top: 8px;
            padding-top: 12px;
            border-top: 1px solid #e2e8f0;
          }
          
          .secure-badge {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 6px;
            color: #718096;
            font-size: 12px;
            margin-top: 20px;
          }
          
          .spinner {
            border: 3px solid #f3f3f3;
            border-top: 3px solid #667eea;
            border-radius: 50%;
            width: 20px;
            height: 20px;
            animation: spin 1s linear infinite;
            display: inline-block;
            vertical-align: middle;
            margin-right: 8px;
          }
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="card">
            <div class="header">
              <h1>💳 Completar pago</h1>
              <p class="subtitle">Método de pago seguro</p>
            </div>
            
            <div class="product-info">
              <div class="product-name">${payment.product}</div>
              <div class="amount">$${payment.amount}</div>
              <span class="status-badge status-${payment.status}">${
                payment.status === 'pending' ? '⏳ Pendiente' :
                payment.status === 'recovered' ? '✅ Pagado' :
                '❌ Rechazado'
              }</span>
              <div class="info-row">
                <span>Para: ${payment.email}</span>
                <span>Intentos: ${payment.retries}/3</span>
              </div>
            </div>
            </div>
            
            ${payment.status === 'recovered' ? 
              '<div class="message success">✅ Este pago ya fue procesado exitosamente</div>' :
              payment.status === 'failed-permanent' ?
              '<div class="message error">❌ No se pudo procesar después de múltiples intentos. Contacta con soporte.</div>' :
              `<form class="payment-form" id="paymentForm" onsubmit="retryPayment(event)">
                <div class="form-group">
                  <label>Número de tarjeta</label>
                  <input type="text" placeholder="1234 5678 9012 3456" maxlength="19" value="4242 4242 4242 4242" readonly>
                </div>
                
                <div class="card-row">
                  <div class="form-group">
                    <label>Expiración</label>
                    <input type="text" placeholder="MM/YY" value="12/25" readonly>
                  </div>
                  <div class="form-group">
                    <label>CVC</label>
                    <input type="text" placeholder="123" value="123" readonly>
                  </div>
                  <div class="form-group">
                    <label>ZIP</label>
                    <input type="text" placeholder="12345" value="10001" readonly>
                  </div>
                </div>
                
                <button type="submit" class="btn-primary" id="submitBtn">
                  🔄 Procesar pago
                </button>
                
                <div class="secure-badge">
                  🔒 Pago seguro y encriptado
                </div>
              </form>`
            }
            
            <div id="result" class="message"></div>
          </div>
        </div>
        
        <script>
          async function retryPayment(event) {
            event.preventDefault();
            
            const btn = document.getElementById('submitBtn');
            const result = document.getElementById('result');
            
            btn.disabled = true;
            btn.innerHTML = '<span class="spinner"></span> Procesando...';
            result.className = 'message';
            result.style.display = 'none';
            
            try {
              const response = await fetch('/api/payments/${payment.id}/retry', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
              });
              
              const data = await response.json();
              
              if (data.result && data.result.success) {
                result.className = 'message success';
                result.textContent = '✅ ¡Pago procesado exitosamente!';
                btn.style.display = 'none';
                document.querySelector('.payment-form').style.display = 'none';
                setTimeout(() => location.reload(), 2000);
              } else {
                const retries = data.result.retries || 0;
                if (retries >= 3) {
                  result.className = 'message error';
                  result.textContent = '❌ No se pudo procesar el pago después de múltiples intentos';
                  btn.style.display = 'none';
                } else {
                  result.className = 'message error';
                  result.textContent = \`❌ Intento fallido (\${retries}/3). Seguiremos intentando automáticamente.\`;
                  btn.disabled = false;
                  btn.textContent = '🔄 Procesar pago';
                }
              }
            } catch (error) {
              result.className = 'message error';
              result.textContent = '❌ Error de conexión. Intenta de nuevo.';
              btn.disabled = false;
              btn.textContent = '🔄 Procesar pago';
            }
          }
        </script>
      </body>
      </html>
    `;
    
    res.send(html);
    
  } catch (error) {
    console.error('❌ Error en página de retry:', error);
    res.status(500).send('Error interno del servidor');
  }
});

/**
 * POST /seed-test-payment - Crear pago de prueba - PROTEGIDA
 * AHORA CON VERIFICACIÓN DE LÍMITES
 */
router.post('/seed-test-payment', authenticateToken, checkPlanLimits, async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const token = uuidv4();
    const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
    const retryLink = `${baseUrl}/retry/${token}`;
    
    const testPayment = {
      id: `pay_test_${Date.now()}`,
      email: 'test@ejemplo.com',
      product: 'Curso de prueba',
      amount: 49.99,
      status: 'pending',
      retries: 0,
      token,
      retry_link: retryLink,
      tenant_id: tenantId  // ✅ Asigna al tenant del usuario autenticado
    };
    
    insertPayment(testPayment);
    
    // Incrementar contador de pagos usados
    trackPaymentUsage(req, res, () => {});
    
    await sendPaymentFailedEmail(testPayment.email, testPayment.product, testPayment.amount, retryLink, tenantId);
    
    console.log(`✅ Pago de prueba creado: ${testPayment.id} para tenant ${tenantId}`);
    
    res.json({ 
      success: true, 
      payment: testPayment,
      message: 'Pago de prueba creado exitosamente'
    });
    
  } catch (error) {
    console.error('❌ Error creando pago de prueba:', error);
    res.status(500).json({ error: 'Error creando pago de prueba' });
  }
});

/**
 * GET /api/config - Obtener configuración actual - PROTEGIDA
 */
router.get('/api/config', authenticateToken, (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const config = getConfig(tenantId);
    res.json({ success: true, config });
  } catch (error) {
    console.error('❌ Error obteniendo configuración:', error);
    res.status(500).json({ error: 'Error obteniendo configuración' });
  }
});

/**
 * POST /api/config - Actualizar configuración - PROTEGIDA
 */
router.post('/api/config', authenticateToken, (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const { retry_intervals, max_retries, from_email } = req.body;
    
    const updates = {};
    if (retry_intervals !== undefined) updates.retry_intervals = retry_intervals;
    if (max_retries !== undefined) updates.max_retries = max_retries.toString();
    if (from_email !== undefined) updates.from_email = from_email;
    
    updateMultipleConfig(updates, tenantId);
    
    console.log('✅ Configuración actualizada:', updates);
    
    res.json({ 
      success: true, 
      message: 'Configuración actualizada exitosamente',
      config: getConfig(tenantId)
    });
    
  } catch (error) {
    console.error('❌ Error actualizando configuración:', error);
    res.status(500).json({ error: 'Error actualizando configuración' });
  }
});

/**
 * POST /api/stripe/create-checkout-session - Crear sesión de pago Stripe - PROTEGIDA
 */
router.post('/api/stripe/create-checkout-session', authenticateToken, async (req, res) => {
  try {
    const { paymentId } = req.body;
    const tenantId = req.user.tenantId;
    
    if (!paymentId) {
      return res.status(400).json({ error: 'paymentId es requerido' });
    }
    
    const payment = getPaymentById(paymentId, tenantId);
    
    if (!payment) {
      return res.status(404).json({ error: 'Pago no encontrado' });
    }
    
    if (payment.status === 'recovered') {
      return res.status(400).json({ error: 'Este pago ya fue procesado' });
    }
    
    // Crear sesión de Stripe Checkout
    const result = await createCheckoutSession(payment, tenantId);
    
    if (!result.success) {
      return res.status(500).json({ error: result.error });
    }
    
    console.log(`✅ Stripe Checkout creado para pago ${paymentId}`);
    
    res.json({
      success: true,
      sessionId: result.sessionId,
      url: result.url
    });
    
  } catch (error) {
    console.error('❌ Error creando Checkout Session:', error);
    res.status(500).json({ error: 'Error creando sesión de pago' });
  }
});

/**
 * POST /webhook/stripe - Webhook de Stripe para eventos de pago
 */
router.post('/webhook/stripe', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    const signature = req.headers['stripe-signature'];
    
    // Verificar firma del webhook
    const event = verifyWebhookSignature(req.body, signature);
    
    if (!event) {
      return res.status(400).json({ error: 'Firma de webhook inválida' });
    }
    
    console.log(`📥 Webhook Stripe recibido: ${event.type}`);
    
    // Procesar evento
    const result = await handleWebhookEvent(event);
    
    // Si es un pago exitoso, actualizar en la DB
    if (result.type === 'payment_success') {
      const { payment_id, tenant_id } = result;
      const payment = getPaymentById(payment_id, tenant_id);
      
      if (payment) {
        updatePaymentStatus(payment_id, 'recovered');
        
        // Verificar y desbloquear achievements
        try {
          const user = db.prepare(`
            SELECT id FROM users WHERE tenant_id = ?
          `).get(tenant_id);
          
          if (user) {
            const newBadges = checkAndUnlockAchievements(db, user.id, tenant_id);
            if (newBadges.length > 0) {
              console.log(`🏆 ${newBadges.length} badge(s) desbloqueado(s) para tenant ${tenant_id}`);
            }
          }
        } catch (achievementError) {
          console.error('❌ Error checking achievements:', achievementError);
          // No fallar la actualización del pago si falla el achievement
        }
        
        // Enviar notificación a la empresa
        await sendPaymentRecoveredNotification(payment, 'Stripe Checkout');
        
        console.log(`✅ Pago ${payment_id} recuperado vía Stripe (Tenant: ${tenant_id})`);
      }
    }
    
    res.json({ received: true, result });
    
  } catch (error) {
    console.error('❌ Error procesando webhook Stripe:', error);
    res.status(500).json({ error: 'Error procesando webhook' });
  }
});

/**
 * GET /api/notifications - Obtener configuración de notificaciones - PROTEGIDA
 */
router.get('/api/notifications', authenticateToken, (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const settings = getNotificationSettings(tenantId);
    
    res.json({ 
      success: true, 
      settings: {
        ...settings,
        email_on_recovery: Boolean(settings.email_on_recovery),
        email_on_failure: Boolean(settings.email_on_failure),
        daily_summary: Boolean(settings.daily_summary),
        weekly_summary: Boolean(settings.weekly_summary),
        send_alerts: Boolean(settings.send_alerts)
      }
    });
  } catch (error) {
    console.error('❌ Error obteniendo configuración de notificaciones:', error);
    res.status(500).json({ error: 'Error obteniendo configuración' });
  }
});

/**
 * POST /api/notifications - Actualizar configuración de notificaciones - PROTEGIDA
 */
router.post('/api/notifications', authenticateToken, (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const updates = req.body;
    
    const updated = updateNotificationSettings(tenantId, updates);
    
    console.log('✅ Configuración de notificaciones actualizada para tenant:', tenantId);
    
    res.json({ 
      success: true, 
      message: 'Configuración de notificaciones actualizada',
      settings: {
        ...updated,
        email_on_recovery: Boolean(updated.email_on_recovery),
        email_on_failure: Boolean(updated.email_on_failure),
        daily_summary: Boolean(updated.daily_summary),
        weekly_summary: Boolean(updated.weekly_summary),
        send_alerts: Boolean(updated.send_alerts)
      }
    });
  } catch (error) {
    console.error('❌ Error actualizando configuración de notificaciones:', error);
    res.status(500).json({ error: 'Error actualizando configuración' });
  }
});

/**
 * GET /api/integrations - Obtener integraciones del tenant - PROTEGIDA
 */
router.get('/api/integrations', authenticateToken, (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const integrations = getTenantIntegrations(tenantId);
    
    // Desencriptar y enmascarar las keys para mostrar en UI
    const response = {
      stripe_secret_key: integrations.stripe_secret_key 
        ? maskApiKey(decrypt(integrations.stripe_secret_key)) 
        : null,
      stripe_publishable_key: integrations.stripe_publishable_key 
        ? decrypt(integrations.stripe_publishable_key) 
        : null,
      stripe_webhook_secret: integrations.stripe_webhook_secret 
        ? maskApiKey(decrypt(integrations.stripe_webhook_secret)) 
        : null,
      resend_api_key: integrations.resend_api_key 
        ? maskApiKey(decrypt(integrations.resend_api_key)) 
        : null,
      from_email: integrations.from_email || '',
      is_stripe_connected: Boolean(integrations.is_stripe_connected),
      is_resend_connected: Boolean(integrations.is_resend_connected),
      updated_at: integrations.updated_at
    };
    
    res.json({ success: true, integrations: response });
  } catch (error) {
    console.error('❌ Error obteniendo integraciones:', error);
    res.status(500).json({ error: 'Error obteniendo integraciones' });
  }
});

/**
 * POST /api/integrations - Actualizar integraciones del tenant - PROTEGIDA
 */
router.post('/api/integrations', authenticateToken, (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const { 
      stripe_secret_key, 
      stripe_publishable_key, 
      stripe_webhook_secret,
      resend_api_key,
      from_email 
    } = req.body;
    
    const updates = {};
    
    // Validar y encriptar Stripe Secret Key
    if (stripe_secret_key !== undefined && stripe_secret_key !== '') {
      if (!validateStripeKey(stripe_secret_key, 'secret')) {
        return res.status(400).json({ 
          error: 'Stripe Secret Key inválida. Debe comenzar con sk_test_ o sk_live_' 
        });
      }
      updates.stripe_secret_key = encrypt(stripe_secret_key);
    }
    
    // Validar y encriptar Stripe Publishable Key
    if (stripe_publishable_key !== undefined && stripe_publishable_key !== '') {
      if (!validateStripeKey(stripe_publishable_key, 'publishable')) {
        return res.status(400).json({ 
          error: 'Stripe Publishable Key inválida. Debe comenzar con pk_test_ o pk_live_' 
        });
      }
      updates.stripe_publishable_key = encrypt(stripe_publishable_key);
    }
    
    // Validar y encriptar Stripe Webhook Secret
    if (stripe_webhook_secret !== undefined && stripe_webhook_secret !== '') {
      if (!validateStripeKey(stripe_webhook_secret, 'webhook')) {
        return res.status(400).json({ 
          error: 'Stripe Webhook Secret inválido. Debe comenzar con whsec_' 
        });
      }
      updates.stripe_webhook_secret = encrypt(stripe_webhook_secret);
    }
    
    // Validar y encriptar Resend API Key
    if (resend_api_key !== undefined && resend_api_key !== '') {
      if (!validateResendKey(resend_api_key)) {
        return res.status(400).json({ 
          error: 'Resend API Key inválida. Debe comenzar con re_' 
        });
      }
      updates.resend_api_key = encrypt(resend_api_key);
    }
    
    // Email de envío
    if (from_email !== undefined) {
      updates.from_email = from_email;
    }
    
    // Marcar como conectado si hay keys
    if (stripe_secret_key || stripe_publishable_key) {
      updates.is_stripe_connected = true;
    }
    
    if (resend_api_key) {
      updates.is_resend_connected = true;
    }
    
    // Actualizar en DB
    const updated = updateTenantIntegrations(tenantId, updates);
    
    console.log(`✅ Integraciones actualizadas para tenant ${tenantId}`);
    
    // Responder con datos enmascarados
    const response = {
      stripe_secret_key: updated.stripe_secret_key 
        ? maskApiKey(decrypt(updated.stripe_secret_key)) 
        : null,
      stripe_publishable_key: updated.stripe_publishable_key 
        ? decrypt(updated.stripe_publishable_key) 
        : null,
      stripe_webhook_secret: updated.stripe_webhook_secret 
        ? maskApiKey(decrypt(updated.stripe_webhook_secret)) 
        : null,
      resend_api_key: updated.resend_api_key 
        ? maskApiKey(decrypt(updated.resend_api_key)) 
        : null,
      from_email: updated.from_email || '',
      is_stripe_connected: Boolean(updated.is_stripe_connected),
      is_resend_connected: Boolean(updated.is_resend_connected)
    };
    
    res.json({ 
      success: true, 
      message: 'Integraciones actualizadas exitosamente',
      integrations: response 
    });
    
  } catch (error) {
    console.error('❌ Error actualizando integraciones:', error);
    res.status(500).json({ error: error.message || 'Error actualizando integraciones' });
  }
});

/**
 * ============================================
 *  RUTAS DE SUSCRIPCIONES Y BILLING
 * ============================================
 */

/**
 * GET /api/subscription
 * Obtiene la suscripción actual del tenant
 */
router.get('/api/subscription', authenticateToken, attachSubscription, (req, res) => {
  try {
    const subscription = req.subscription;
    const plan = getPlan(subscription.plan);
    const usage = getUsagePercentage(subscription);
    const showWarning = shouldShowLimitWarning(subscription);
    
    const now = Math.floor(Date.now() / 1000);
    const trialDaysLeft = subscription.trial_ends_at 
      ? Math.max(0, Math.ceil((subscription.trial_ends_at - now) / 86400))
      : 0;
    
    res.json({
      success: true,
      subscription: {
        plan: subscription.plan,
        planName: plan.name,
        status: subscription.status,
        paymentsUsed: subscription.payments_used,
        paymentsLimit: subscription.payments_limit,
        usagePercentage: usage,
        showWarning,
        trialEndsAt: subscription.trial_ends_at,
        trialDaysLeft,
        currentPeriodEnd: subscription.current_period_end,
        stripeCustomerId: subscription.stripe_customer_id,
        stripeSubscriptionId: subscription.stripe_subscription_id
      },
      check: req.usageCheck
    });
  } catch (error) {
    console.error('Error obteniendo suscripción:', error);
    res.status(500).json({ error: 'Error obteniendo suscripción' });
  }
});

/**
 * GET /api/plans
 * Obtiene todos los planes disponibles
 */
router.get('/api/plans', (req, res) => {
  try {
    const plans = getAllPlans();
    // Convertir IDs a mayúsculas para el frontend
    const normalizedPlans = plans.map(plan => ({
      ...plan,
      id: plan.id.toUpperCase()
    }));
    
    res.json({
      success: true,
      plans: normalizedPlans
    });
  } catch (error) {
    console.error('Error obteniendo planes:', error);
    res.status(500).json({ error: 'Error obteniendo planes' });
  }
});

/**
 * POST /api/create-checkout
 * Crea sesión de Stripe Checkout para upgrade
 */
router.post('/api/create-checkout', authenticateToken, async (req, res) => {
  try {
    const { planId } = req.body;
    const { email, tenantId } = req.user;
    
    if (!planId) {
      return res.status(400).json({ error: 'Plan ID es requerido' });
    }
    
    // Convertir planId a minúsculas para que coincida con PLANS
    const normalizedPlanId = planId.toLowerCase();
    
    const plan = getPlan(normalizedPlanId);
    if (!plan) {
      return res.status(400).json({ error: 'Plan no encontrado' });
    }
    
    if (normalizedPlanId === 'free') {
      return res.status(400).json({ error: 'No puedes comprar el plan gratuito' });
    }
    
    const baseUrl = process.env.BASE_URL || 'http://localhost:5173';
    const session = await createBillingCheckout(
      tenantId,
      normalizedPlanId,
      email,
      `${baseUrl}/dashboard?upgrade=success`,
      `${baseUrl}/pricing?upgrade=canceled`
    );
    
    res.json({
      success: true,
      url: session.url,
      sessionId: session.id
    });
    
  } catch (error) {
    console.error('Error creando checkout:', error);
    res.status(500).json({ error: error.message || 'Error creando checkout' });
  }
});

/**
 * POST /api/test-checkout - SOLO PARA PRUEBAS
 * Crear checkout con producto de €0.10 para verificar Stripe
 * ELIMINAR DESPUÉS DE VERIFICAR
 */
router.post('/api/test-checkout', authenticateToken, async (req, res) => {
  try {
    const { email, tenantId } = req.user;
    
    // Usar el Price ID de test desde .env
    const testPriceId = process.env.STRIPE_PRICE_TEST_PAYMENT;
    
    if (!testPriceId) {
      return res.status(500).json({ 
        error: 'STRIPE_PRICE_TEST_PAYMENT no configurado en .env' 
      });
    }
    
    const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
    const baseUrl = process.env.BASE_URL || 'http://localhost:5173';
    
    console.log('💳 Creando test checkout (€0.10) para:', email);
    console.log('📦 Test Price ID:', testPriceId);
    
    const session = await stripe.checkout.sessions.create({
      mode: 'payment', // Pago único, no suscripción
      payment_method_types: ['card'],
      line_items: [
        {
          price: testPriceId,
          quantity: 1
        }
      ],
      customer_email: email,
      client_reference_id: tenantId,
      metadata: {
        tenant_id: tenantId,
        test_payment: 'true'
      },
      success_url: `${baseUrl}/dashboard?test=success`,
      cancel_url: `${baseUrl}/dashboard?test=canceled`
    });
    
    console.log('✅ Test checkout creado:', session.id);
    
    res.json({
      success: true,
      url: session.url,
      sessionId: session.id
    });
    
  } catch (error) {
    console.error('❌ Error creando test checkout:', error);
    res.status(500).json({ error: error.message || 'Error creando test checkout' });
  }
});

/**
 * POST /api/create-portal
 * Crea sesión del Customer Portal de Stripe
 */
router.post('/api/create-portal', authenticateToken, async (req, res) => {
  try {
    const subscription = getSubscription(req.user.tenantId);
    
    if (!subscription.stripe_customer_id) {
      return res.status(400).json({ 
        error: 'No tienes una suscripción activa',
        message: 'Primero debes suscribirte a un plan de pago'
      });
    }
    
    const { returnUrl } = req.body;
    const baseUrl = process.env.BASE_URL || 'http://localhost:5173';
    const finalReturnUrl = returnUrl || `${baseUrl}/dashboard`;
    
    const session = await createPortalSession(
      subscription.stripe_customer_id,
      finalReturnUrl
    );
    
    res.json({
      success: true,
      url: session.url
    });
    
  } catch (error) {
    console.error('Error creando portal:', error);
    res.status(500).json({ error: error.message || 'Error creando portal' });
  }
});

/**
 * POST /webhook/stripe-billing
 * Webhook de Stripe para eventos de billing
 */
router.post('/webhook/stripe-billing', async (req, res) => {
  try {
    const sig = req.headers['stripe-signature'];
    const webhookSecret = process.env.STRIPE_BILLING_WEBHOOK_SECRET;
    
    if (!webhookSecret) {
      console.warn('⚠️ STRIPE_BILLING_WEBHOOK_SECRET no configurado');
      return res.status(400).json({ error: 'Webhook secret no configurado' });
    }
    
    let event;
    try {
      event = verifyWebhook(req.body, sig, webhookSecret);
    } catch (err) {
      console.error('❌ Error verificando webhook:', err.message);
      return res.status(400).json({ error: `Webhook Error: ${err.message}` });
    }
    
    console.log(`📨 Webhook recibido: ${event.type}`);
    
    await handleBillingWebhook(event);
    
    res.json({ received: true });
    
  } catch (error) {
    console.error('❌ Error procesando webhook de billing:', error);
    res.status(500).json({ error: 'Error procesando webhook' });
  }
});

/**
 * POST /api/whop/sync - Sincronizar pagos fallidos desde Whop manualmente
 * Botón "Sincronizar con Whop" en el Dashboard
 */
router.post('/api/whop/sync', authenticateToken, async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    
    // Obtener API key de Whop del tenant
    const integrations = getTenantIntegrations(tenantId);
    
    if (!integrations || !integrations.whop_api_key) {
      return res.status(400).json({
        error: 'Whop no configurado',
        message: 'Debes configurar tu API key de Whop en Configuración → Integraciones'
      });
    }
    
    // Desencriptar API key
    const whopApiKey = decrypt(integrations.whop_api_key);
    
    // Sincronizar pagos
    const result = await syncFailedPayments(whopApiKey, tenantId);
    
    res.json({
      success: result.success,
      message: `Sincronización completada: ${result.inserted} pagos nuevos importados`,
      stats: result
    });
    
  } catch (error) {
    console.error('❌ Error en sincronización manual:', error);
    res.status(500).json({
      error: 'Error sincronizando',
      message: error.message
    });
  }
});

/**
 * POST /webhook/whop-sync/:tenantId - Webhook de Whop para notificaciones en tiempo real
 * Whop debe estar configurado para enviar webhooks a esta URL
 */
router.post('/webhook/whop-sync/:tenantId', async (req, res) => {
  try {
    const { tenantId } = req.params;
    
    // Procesar webhook
    const result = await processWhopWebhook(req.body, tenantId);
    
    res.json({
      success: result.success,
      message: result.message
    });
    
  } catch (error) {
    console.error('❌ Error procesando webhook de Whop:', error);
    res.status(500).json({
      error: 'Error procesando webhook',
      message: error.message
    });
  }
});

/**
 * GET /api/whop/status - Verificar estado de conexión con Whop
 */
router.get('/api/whop/status', authenticateToken, async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const integrations = getTenantIntegrations(tenantId);
    
    if (!integrations || !integrations.whop_api_key) {
      return res.json({
        connected: false,
        message: 'Whop no configurado'
      });
    }
    
    const whopApiKey = decrypt(integrations.whop_api_key);
    const isValid = await validateWhopApiKey(whopApiKey);
    
    res.json({
      connected: isValid,
      message: isValid ? 'Conexión activa' : 'API key inválida'
    });
    
  } catch (error) {
    console.error('❌ Error verificando Whop:', error);
    res.status(500).json({
      connected: false,
      error: error.message
    });
  }
});

/**
 * GET /api/debug/users - Endpoint temporal para ver usuarios (ELIMINAR EN PRODUCCIÓN)
 */
router.get('/api/debug/users', (req, res) => {
  try {
    const { db } = require('./db');
    const users = db.prepare('SELECT id, email, company_name, tenant_id, created_at FROM users ORDER BY created_at DESC').all();
    
    res.json({
      total: users.length,
      users: users.map(u => ({
        ...u,
        created_at: new Date(u.created_at * 1000).toISOString()
      }))
    });
  } catch (error) {
    console.error('❌ Error listing users:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/user/onboarding - Obtener estado de onboarding del usuario
 */
router.get('/api/user/onboarding', authenticateToken, (req, res) => {
  try {
    const userId = req.user.userId;
    
    // Try to get onboarding data, fallback to defaults if columns don't exist
    let user;
    try {
      user = db.prepare(`
        SELECT onboarding_step, onboarding_completed_at 
        FROM users 
        WHERE id = ?
      `).get(userId);
    } catch (error) {
      // Columns don't exist yet, return defaults
      if (error.code === 'SQLITE_ERROR') {
        return res.json({
          onboarding_step: 0,
          completed: false,
          completed_at: null
        });
      }
      throw error;
    }
    
    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    
    res.json({
      onboarding_step: user.onboarding_step || 0,
      completed: user.onboarding_step >= 4,
      completed_at: user.onboarding_completed_at
    });
    
  } catch (error) {
    console.error('❌ Error obteniendo onboarding:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * PATCH /api/user/onboarding - Actualizar progreso de onboarding
 */
router.patch('/api/user/onboarding', authenticateToken, (req, res) => {
  try {
    const userId = req.user.userId;
    const { step } = req.body;
    
    if (typeof step !== 'number' || step < 0 || step > 4) {
      return res.status(400).json({ error: 'Step debe ser un número entre 0 y 4' });
    }
    
    const now = Math.floor(Date.now() / 1000);
    
    try {
      // Si completa el onboarding (step 4), guardar timestamp
      if (step === 4) {
        db.prepare(`
          UPDATE users 
          SET onboarding_step = ?, onboarding_completed_at = ?
          WHERE id = ?
        `).run(step, now, userId);
      } else {
        db.prepare(`
          UPDATE users 
          SET onboarding_step = ?
          WHERE id = ?
        `).run(step, userId);
      }
    } catch (error) {
      // Columns don't exist yet, ignore silently
      if (error.code === 'SQLITE_ERROR') {
        console.log('⚠️ Onboarding columns not found, skipping update');
        return res.json({
          success: true,
          onboarding_step: step,
          message: 'Onboarding columns pending migration'
        });
      }
      throw error;
    }
    
    res.json({
      success: true,
      onboarding_step: step,
      completed: step >= 4
    });
    
  } catch (error) {
    console.error('❌ Error actualizando onboarding:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/achievements - Obtener achievements del usuario
 */
router.get('/api/achievements', authenticateToken, (req, res) => {
  try {
    const userId = req.user.userId;
    const achievements = getUserAchievements(db, userId);
    
    res.json({
      achievements,
      total: achievements.length
    });
    
  } catch (error) {
    console.error('❌ Error obteniendo achievements:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/achievements/progress - Obtener progreso hacia badges
 */
router.get('/api/achievements/progress', authenticateToken, (req, res) => {
  try {
    const userId = req.user.userId;
    const tenantId = req.user.tenantId;
    
    const unlocked = getUserAchievements(db, userId);
    const locked = getBadgeProgress(db, userId, tenantId);
    
    res.json({
      unlocked,
      locked,
      total_unlocked: unlocked.length,
      total_badges: unlocked.length + locked.length
    });
    
  } catch (error) {
    console.error('❌ Error obteniendo progreso:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/achievements/check - Verificar y desbloquear achievements
 */
router.post('/api/achievements/check', authenticateToken, (req, res) => {
  try {
    const userId = req.user.userId;
    const tenantId = req.user.tenantId;
    
    const newBadges = checkAndUnlockAchievements(db, userId, tenantId);
    
    res.json({
      success: true,
      new_badges: newBadges,
      count: newBadges.length
    });
    
  } catch (error) {
    console.error('❌ Error verificando achievements:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/test-email - Endpoint temporal para probar emails (ELIMINAR EN PRODUCCIÓN)
 */
router.post('/api/test-email', async (req, res) => {
  try {
    const { type, email } = req.body;
    
    if (!email) {
      return res.status(400).json({ error: 'Email requerido' });
    }
    
    let result;
    
    switch (type) {
      case 'welcome':
        result = await sendWelcomeEmail(email, 'Usuario de Prueba');
        break;
      case 'payment-success':
        result = await sendPaymentSuccessEmail(email, 'Usuario de Prueba', '49.00', 'pro');
        break;
      case 'payment-failed':
        result = await sendPaymentFailedEmailSG(email, 'Usuario de Prueba', 'Fondos insuficientes');
        break;
      case 'recovery':
        result = await sendRecoverySuccessEmail(email, 'Usuario de Prueba', '29.99', 'Cliente Ejemplo');
        break;
      default:
        return res.status(400).json({ error: 'Tipo no válido. Usa: welcome, payment-success, payment-failed, recovery' });
    }
    
    res.json({ 
      success: result.success,
      message: `Email de prueba (${type}) enviado a ${email}`
    });
    
  } catch (error) {
    console.error('❌ Error enviando email de prueba:', error);
    res.status(500).json({ 
      error: 'Error enviando email',
      message: error.message 
    });
  }
});

// ============================================
// ADMIN PANEL ENDPOINTS
// ============================================

/**
 * GET /api/admin/users
 * Lista todos los usuarios (solo admin)
 */
router.get('/api/admin/users', authenticateToken, (req, res) => {
  try {
    // Solo permitir acceso al admin
    if (req.user.email !== 'marcps2001@gmail.com') {
      return res.status(403).json({ error: 'Acceso denegado' });
    }

    const { filter } = req.query;

    let query = `
      SELECT 
        u.id,
        u.email,
        u.company_name,
        u.created_at,
        u.tenant_id,
        0 as onboarding_step,
        NULL as onboarding_completed_at,
        s.plan as subscription_plan,
        (SELECT COUNT(*) FROM payments WHERE tenant_id = u.tenant_id) as total_payments,
        (SELECT COUNT(*) FROM payments WHERE tenant_id = u.tenant_id AND status = 'recovered') as recovered_payments,
        0 as badges_count
      FROM users u
      LEFT JOIN subscriptions s ON u.tenant_id = s.tenant_id
    `;

    if (filter && filter !== 'all') {
      query += ` WHERE s.plan = ?`;
      const users = db.prepare(query).all(filter);
      return res.json({ users });
    }

    const users = db.prepare(query).all();
    res.json({ users });

  } catch (error) {
    console.error('❌ Error obteniendo usuarios:', error);
    res.status(500).json({ error: 'Error obteniendo usuarios' });
  }
});

/**
 * GET /api/admin/stats
 * Estadísticas globales (solo admin)
 */
router.get('/api/admin/stats', authenticateToken, (req, res) => {
  try {
    // Solo permitir acceso al admin
    if (req.user.email !== 'marcps2001@gmail.com') {
      return res.status(403).json({ error: 'Acceso denegado' });
    }

    const totalUsers = db.prepare('SELECT COUNT(*) as count FROM users').get().count || 0;
    const totalRecovered = db.prepare('SELECT COUNT(*) as count FROM payments WHERE status = "recovered"').get().count || 0;
    const proUsers = db.prepare('SELECT COUNT(*) as count FROM subscriptions WHERE plan = "pro"').get().count || 0;
    
    // Calcular MRR (Monthly Recurring Revenue)
    const proCount = proUsers;
    const enterpriseCount = db.prepare('SELECT COUNT(*) as count FROM subscriptions WHERE plan = "enterprise"').get().count || 0;
    const mrr = (proCount * 29) + (enterpriseCount * 99); // $29/mes Pro, $99/mes Enterprise

    res.json({
      totalUsers: totalUsers || 0,
      totalRecovered: totalRecovered || 0,
      proUsers: proUsers || 0,
      enterpriseUsers: enterpriseCount || 0,
      mrr: mrr || 0
    });

  } catch (error) {
    console.error('❌ Error obteniendo stats:', error);
    // Devolver valores por defecto en caso de error para evitar crash del frontend
    res.json({
      totalUsers: 0,
      totalRecovered: 0,
      proUsers: 0,
      enterpriseUsers: 0,
      mrr: 0
    });
  }
});

/**
 * DELETE /api/admin/users/:userId
 * Eliminar usuario (solo admin)
 */
router.delete('/api/admin/users/:userId', authenticateToken, (req, res) => {
  try {
    // Solo permitir acceso al admin
    if (req.user.email !== 'marcps2001@gmail.com') {
      return res.status(403).json({ error: 'Acceso denegado' });
    }

    const { userId } = req.params;

    // Verificar que el usuario existe
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
    
    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    // No permitir borrar al admin
    if (user.email === 'marcps2001@gmail.com') {
      return res.status(403).json({ error: 'No puedes eliminar tu propia cuenta de administrador' });
    }

    const tenantId = user.tenant_id;

    // Eliminar datos relacionados con el tenant (en orden de dependencias)
    // Usar try-catch para cada DELETE en caso de que alguna tabla no exista
    try {
      db.prepare('DELETE FROM achievements WHERE user_id = ?').run(userId);
    } catch (e) {
      console.log('⚠️ No se pudo eliminar achievements (tabla no existe)');
    }
    
    try {
      db.prepare('DELETE FROM notification_settings WHERE tenant_id = ?').run(tenantId);
    } catch (e) {
      console.log('⚠️ No se pudo eliminar notification_settings');
    }
    
    try {
      db.prepare('DELETE FROM tenant_integrations WHERE tenant_id = ?').run(tenantId);
    } catch (e) {
      console.log('⚠️ No se pudo eliminar tenant_integrations');
    }
    
    try {
      db.prepare('DELETE FROM config WHERE tenant_id = ?').run(tenantId);
    } catch (e) {
      console.log('⚠️ No se pudo eliminar config');
    }
    
    try {
      db.prepare('DELETE FROM payments WHERE tenant_id = ?').run(tenantId);
    } catch (e) {
      console.log('⚠️ No se pudo eliminar payments');
    }
    
    try {
      db.prepare('DELETE FROM subscriptions WHERE tenant_id = ?').run(tenantId);
    } catch (e) {
      console.log('⚠️ No se pudo eliminar subscriptions');
    }
    
    // Finalmente, eliminar el usuario
    db.prepare('DELETE FROM users WHERE id = ?').run(userId);

    console.log(`✅ Usuario ${user.email} eliminado por admin`);

    res.json({ 
      success: true, 
      message: `Usuario ${user.email} eliminado correctamente` 
    });
  } catch (error) {
    console.error('❌ Error eliminando usuario:', error);
    res.status(500).json({ error: 'Error eliminando usuario' });
  }
});

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Valida que la API key de Resend sea válida
 */
function validateResendKey(apiKey) {
  if (!apiKey || typeof apiKey !== 'string') return false;
  // Resend API keys empiezan con "re_"
  return apiKey.trim().startsWith('re_') && apiKey.length > 20;
}

module.exports = router;

