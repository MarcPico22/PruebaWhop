const Stripe = require('stripe');
const { getTenantIntegrations } = require('./db');
const { decrypt } = require('./encryption');

/**
 * Obtiene la instancia de Stripe del tenant (con sus propias API keys)
 */
function getStripeInstance(tenantId) {
  const integrations = getTenantIntegrations(tenantId);
  
  if (!integrations.stripe_secret_key) {
    // Fallback a demo key si existe
    const demoKey = process.env.DEMO_STRIPE_SECRET_KEY;
    if (demoKey && demoKey.startsWith('sk_')) {
      console.warn(`⚠️ Usando Stripe DEMO key para tenant ${tenantId}`);
      return Stripe(demoKey);
    }
    throw new Error('Esta empresa no ha configurado Stripe. Por favor, configure sus API keys en Integraciones.');
  }
  
  const stripeKey = decrypt(integrations.stripe_secret_key);
  return Stripe(stripeKey);
}

/**
 * Crea una sesión de Checkout de Stripe para procesar un pago
 */
async function createCheckoutSession(payment, tenantId) {
  const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
  
  try {
    // Obtener Stripe del tenant
    const stripe = getStripeInstance(tenantId);
    
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: payment.product,
              description: `Recuperación de pago fallido - ${payment.email}`,
            },
            unit_amount: Math.round(payment.amount * 100), // Stripe usa centavos
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${baseUrl}/retry/${payment.token}?success=true`,
      cancel_url: `${baseUrl}/retry/${payment.token}?canceled=true`,
      customer_email: payment.email,
      metadata: {
        payment_id: payment.id,
        tenant_id: tenantId,
        retry_token: payment.token
      },
    });

    return {
      success: true,
      sessionId: session.id,
      url: session.url
    };
  } catch (error) {
    console.error('❌ Error creando Stripe Checkout Session:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Verifica la firma del webhook de Stripe para seguridad
 * NOTA: Por ahora usa webhook secret global, pero debería usar del tenant
 * TODO: Mejorar para identificar tenant desde el evento y usar su webhook secret
 */
function verifyWebhookSignature(payload, signature, tenantId = null) {
  let webhookSecret;
  
  if (tenantId) {
    // Usar webhook secret del tenant
    const integrations = getTenantIntegrations(tenantId);
    if (integrations.stripe_webhook_secret) {
      webhookSecret = decrypt(integrations.stripe_webhook_secret);
    }
  }
  
  // Fallback a demo webhook secret
  if (!webhookSecret) {
    webhookSecret = process.env.DEMO_STRIPE_WEBHOOK_SECRET || process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) {
      console.warn('⚠️ No hay webhook secret configurado');
      return null;
    }
  }

  try {
    // Crear instancia temporal de Stripe para verificar webhook
    const stripeTemp = Stripe(process.env.DEMO_STRIPE_SECRET_KEY || 'sk_test_dummy');
    const event = stripeTemp.webhooks.constructEvent(
      payload,
      signature,
      webhookSecret
    );
    return event;
  } catch (error) {
    console.error('❌ Error verificando firma de webhook:', error.message);
    return null;
  }
}

/**
 * Procesa un evento de webhook de Stripe
 */
async function handleWebhookEvent(event) {
  switch (event.type) {
    case 'checkout.session.completed':
      const session = event.data.object;
      return {
        type: 'payment_success',
        payment_id: session.metadata.payment_id,
        tenant_id: session.metadata.tenant_id,
        amount_paid: session.amount_total / 100, // Convertir de centavos
        customer_email: session.customer_email,
        stripe_payment_intent: session.payment_intent
      };

    case 'payment_intent.succeeded':
      const paymentIntent = event.data.object;
      return {
        type: 'payment_confirmed',
        amount: paymentIntent.amount / 100,
        currency: paymentIntent.currency,
        stripe_payment_id: paymentIntent.id
      };

    case 'payment_intent.payment_failed':
      const failedIntent = event.data.object;
      return {
        type: 'payment_failed',
        error: failedIntent.last_payment_error?.message,
        stripe_payment_id: failedIntent.id
      };

    default:
      console.log(`ℹ️ Evento Stripe no manejado: ${event.type}`);
      return { type: 'unhandled', event_type: event.type };
  }
}

/**
 * Crea un Payment Intent directo (sin Checkout)
 */
async function createPaymentIntent(amount, currency = 'usd', metadata = {}) {
  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100),
      currency,
      metadata,
      automatic_payment_methods: {
        enabled: true,
      },
    });

    return {
      success: true,
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id
    };
  } catch (error) {
    console.error('❌ Error creando Payment Intent:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

module.exports = {
  stripe,
  createCheckoutSession,
  getStripeInstance,
  verifyWebhookSignature,
  handleWebhookEvent,
  createPaymentIntent
};
