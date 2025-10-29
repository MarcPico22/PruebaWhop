const axios = require('axios');
const { insertPayment, getPayments } = require('./db');
const { sendPaymentFailedEmail } = require('./mailer');
const { v4: uuidv4 } = require('uuid');

const WHOP_API_URL = 'https://api.whop.com/v2';

/**
 * Obtiene todos los pagos fallidos desde Whop para un tenant específico
 * @param {string} whopApiKey - API key de Whop del tenant
 * @param {number} tenantId - ID del tenant
 * @param {number} limit - Límite de resultados (default: 100)
 * @returns {Promise<Array>} - Array de pagos fallidos
 */
async function getFailedPaymentsFromWhop(whopApiKey, tenantId, limit = 100) {
  try {
    console.log(`🔍 Consultando pagos fallidos desde Whop para tenant ${tenantId}...`);
    
    const response = await axios.get(`${WHOP_API_URL}/payments`, {
      headers: {
        'Authorization': `Bearer ${whopApiKey}`,
        'Content-Type': 'application/json'
      },
      params: {
        status: 'failed',
        limit: limit,
        sort: '-created_at' // Más recientes primero
      }
    });

    const failedPayments = response.data.data || [];
    console.log(`✅ Encontrados ${failedPayments.length} pagos fallidos en Whop`);
    
    return failedPayments;
    
  } catch (error) {
    console.error('❌ Error consultando Whop API:', error.response?.data || error.message);
    throw new Error(`Error conectando con Whop: ${error.message}`);
  }
}

/**
 * Obtiene un pago específico desde Whop
 * @param {string} whopApiKey - API key de Whop
 * @param {string} paymentId - ID del pago en Whop
 * @returns {Promise<Object>} - Datos del pago
 */
async function getPaymentFromWhop(whopApiKey, paymentId) {
  try {
    const response = await axios.get(`${WHOP_API_URL}/payments/${paymentId}`, {
      headers: {
        'Authorization': `Bearer ${whopApiKey}`,
        'Content-Type': 'application/json'
      }
    });

    return response.data;
    
  } catch (error) {
    console.error(`❌ Error obteniendo pago ${paymentId} de Whop:`, error.message);
    throw error;
  }
}

/**
 * Sincroniza pagos fallidos desde Whop a la base de datos local
 * @param {string} whopApiKey - API key de Whop del tenant
 * @param {number} tenantId - ID del tenant
 * @returns {Promise<Object>} - Resultado de la sincronización
 */
async function syncFailedPayments(whopApiKey, tenantId) {
  try {
    console.log(`🔄 Iniciando sincronización para tenant ${tenantId}...`);
    
    // 1. Obtener pagos fallidos desde Whop
    const whopPayments = await getFailedPaymentsFromWhop(whopApiKey, tenantId);
    
    // 2. Obtener pagos existentes en nuestra DB
    const existingPayments = getPayments(tenantId);
    const existingIds = new Set(existingPayments.map(p => p.id));
    
    // 3. Filtrar solo los pagos nuevos
    const newPayments = whopPayments.filter(wp => !existingIds.has(wp.id));
    
    console.log(`📊 Pagos encontrados: ${whopPayments.length} | Nuevos: ${newPayments.length} | Ya existentes: ${whopPayments.length - newPayments.length}`);
    
    // 4. Insertar nuevos pagos en DB
    let inserted = 0;
    let errors = 0;
    
    for (const whopPayment of newPayments) {
      try {
        const token = uuidv4();
        const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
        const retryLink = `${baseUrl}/retry/${token}`;
        
        const payment = {
          id: whopPayment.id,
          email: whopPayment.customer_email || whopPayment.email || 'unknown@email.com',
          product: whopPayment.product_name || whopPayment.description || 'Unknown Product',
          amount: (whopPayment.amount / 100).toFixed(2), // Whop usa centavos
          status: 'pending',
          retries: 0,
          token,
          retry_link: retryLink,
          tenant_id: tenantId
        };
        
        insertPayment(payment);
        
        // Enviar email inicial
        await sendPaymentFailedEmail(
          payment.email,
          payment.product,
          payment.amount,
          retryLink,
          tenantId
        );
        
        inserted++;
        console.log(`✅ Pago ${payment.id} sincronizado y email enviado`);
        
      } catch (err) {
        console.error(`❌ Error procesando pago ${whopPayment.id}:`, err.message);
        errors++;
      }
    }
    
    const result = {
      success: true,
      total: whopPayments.length,
      new: newPayments.length,
      inserted,
      errors,
      existing: whopPayments.length - newPayments.length
    };
    
    console.log(`✅ Sincronización completada:`, result);
    
    return result;
    
  } catch (error) {
    console.error('❌ Error en sincronización:', error.message);
    return {
      success: false,
      error: error.message,
      total: 0,
      new: 0,
      inserted: 0,
      errors: 1
    };
  }
}

/**
 * Valida que una API key de Whop sea válida
 * @param {string} whopApiKey - API key a validar
 * @returns {Promise<boolean>} - true si es válida
 */
async function validateWhopApiKey(whopApiKey) {
  try {
    // Intentar hacer una petición simple para verificar la key
    const response = await axios.get(`${WHOP_API_URL}/me`, {
      headers: {
        'Authorization': `Bearer ${whopApiKey}`,
        'Content-Type': 'application/json'
      }
    });
    
    return response.status === 200;
    
  } catch (error) {
    console.error('❌ API key de Whop inválida:', error.message);
    return false;
  }
}

/**
 * Procesa un webhook de Whop para un pago fallido en tiempo real
 * @param {Object} webhookData - Datos del webhook
 * @param {number} tenantId - ID del tenant
 * @returns {Promise<Object>} - Resultado del procesamiento
 */
async function processWhopWebhook(webhookData, tenantId) {
  try {
    const { event, data } = webhookData;
    
    // Solo procesar eventos de pagos fallidos
    if (event !== 'payment.failed' && event !== 'payment_failed') {
      return {
        success: true,
        message: 'Evento ignorado',
        processed: false
      };
    }
    
    // Verificar que tengamos los datos necesarios
    if (!data || !data.id) {
      throw new Error('Datos de pago incompletos en webhook');
    }
    
    // Verificar si ya existe
    const existingPayments = getPayments(tenantId);
    const exists = existingPayments.some(p => p.id === data.id);
    
    if (exists) {
      console.log(`ℹ️ Pago ${data.id} ya existe en DB, ignorando webhook`);
      return {
        success: true,
        message: 'Pago ya existe',
        processed: false
      };
    }
    
    // Crear el pago
    const token = uuidv4();
    const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
    const retryLink = `${baseUrl}/retry/${token}`;
    
    const payment = {
      id: data.id,
      email: data.customer_email || data.email || 'unknown@email.com',
      product: data.product_name || data.description || 'Unknown Product',
      amount: data.amount ? (data.amount / 100).toFixed(2) : '0.00',
      status: 'pending',
      retries: 0,
      token,
      retry_link: retryLink,
      tenant_id: tenantId
    };
    
    insertPayment(payment);
    
    // Enviar email
    await sendPaymentFailedEmail(
      payment.email,
      payment.product,
      payment.amount,
      retryLink,
      tenantId
    );
    
    console.log(`✅ Webhook procesado: pago ${payment.id} registrado para tenant ${tenantId}`);
    
    return {
      success: true,
      message: 'Pago procesado desde webhook',
      processed: true,
      payment
    };
    
  } catch (error) {
    console.error('❌ Error procesando webhook de Whop:', error.message);
    throw error;
  }
}

module.exports = {
  getFailedPaymentsFromWhop,
  getPaymentFromWhop,
  syncFailedPayments,
  validateWhopApiKey,
  processWhopWebhook
};
