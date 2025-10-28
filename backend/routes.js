const express = require('express');
const { v4: uuidv4 } = require('uuid');
const {
  insertPayment,
  getPayments,
  getPaymentById,
  getPaymentByToken,
  getStats,
  getConfig,
  updateMultipleConfig
} = require('./db');
const { sendPaymentFailedEmail } = require('./mailer');
const { processRetry } = require('./retry-logic');

const router = express.Router();

/**
 * Webhook de Whop - recibe notificación de pago fallido
 */
router.post('/webhook/whop', async (req, res) => {
  try {
    const { event, data } = req.body;
    
    // Validar evento
    if (event !== 'payment_failed') {
      return res.status(200).json({ message: 'Evento ignorado' });
    }
    
    // Validar datos requeridos
    if (!data || !data.id || !data.email || !data.product || !data.amount) {
      return res.status(400).json({ error: 'Datos incompletos en webhook' });
    }
    
    // Generar token único y retry link
    const token = uuidv4();
    const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
    const retryLink = `${baseUrl}/retry/${token}`;
    
    // Guardar pago en DB
    const payment = {
      id: data.id,
      email: data.email,
      product: data.product,
      amount: data.amount,
      status: 'pending',
      retries: 0,
      token,
      retry_link: retryLink
    };
    
    insertPayment(payment);
    
    // Enviar email inicial
    await sendPaymentFailedEmail(data.email, data.product, data.amount, retryLink);
    
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
 * GET /api/payments - Listar todos los pagos (con filtro opcional)
 */
router.get('/api/payments', (req, res) => {
  try {
    const { status } = req.query;
    const payments = getPayments(status);
    const stats = getStats();
    
    res.json({ payments, stats });
  } catch (error) {
    console.error('❌ Error obteniendo pagos:', error);
    res.status(500).json({ error: 'Error obteniendo pagos' });
  }
});

/**
 * POST /api/payments/:id/retry - Forzar reintento manual
 */
router.post('/api/payments/:id/retry', async (req, res) => {
  try {
    const { id } = req.params;
    const payment = getPaymentById(id);
    
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
 * POST /seed-test-payment - Crear pago de prueba
 */
router.post('/seed-test-payment', async (req, res) => {
  try {
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
      retry_link: retryLink
    };
    
    insertPayment(testPayment);
    await sendPaymentFailedEmail(testPayment.email, testPayment.product, testPayment.amount, retryLink);
    
    console.log(`✅ Pago de prueba creado: ${testPayment.id}`);
    
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
 * GET /api/config - Obtener configuración actual
 */
router.get('/api/config', (req, res) => {
  try {
    const config = getConfig();
    res.json({ success: true, config });
  } catch (error) {
    console.error('❌ Error obteniendo configuración:', error);
    res.status(500).json({ error: 'Error obteniendo configuración' });
  }
});

/**
 * POST /api/config - Actualizar configuración
 */
router.post('/api/config', (req, res) => {
  try {
    const { retry_intervals, max_retries, from_email } = req.body;
    
    const updates = {};
    if (retry_intervals !== undefined) updates.retry_intervals = retry_intervals;
    if (max_retries !== undefined) updates.max_retries = max_retries.toString();
    if (from_email !== undefined) updates.from_email = from_email;
    
    updateMultipleConfig(updates);
    
    console.log('✅ Configuración actualizada:', updates);
    
    res.json({ 
      success: true, 
      message: 'Configuración actualizada exitosamente',
      config: getConfig()
    });
    
  } catch (error) {
    console.error('❌ Error actualizando configuración:', error);
    res.status(500).json({ error: 'Error actualizando configuración' });
  }
});

module.exports = router;
