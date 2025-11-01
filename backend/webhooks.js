const express = require('express');
const router = express.Router();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { updateSubscription, getUserByTenantId } = require('./db');
const { sendPaymentSuccessEmail, sendPaymentFailedEmail } = require('./email');

/**
 * Webhook de Stripe para eventos en tiempo real
 * Stripe CLI test: stripe listen --forward-to localhost:3000/api/webhooks/stripe
 */
router.post('/stripe', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err) {
    console.error('⚠️ Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  console.log(`📩 Webhook recibido: ${event.type}`);

  // Manejar diferentes tipos de eventos
  switch (event.type) {
    case 'checkout.session.completed':
      await handleCheckoutCompleted(event.data.object);
      break;

    case 'invoice.payment_succeeded':
      await handlePaymentSucceeded(event.data.object);
      break;

    case 'invoice.payment_failed':
      await handlePaymentFailed(event.data.object);
      break;

    case 'customer.subscription.updated':
      await handleSubscriptionUpdated(event.data.object);
      break;

    case 'customer.subscription.deleted':
      await handleSubscriptionDeleted(event.data.object);
      break;

    default:
      console.log(`Evento no manejado: ${event.type}`);
  }

  res.json({ received: true });
});

/**
 * Checkout completado - Primera vez que usuario paga
 */
async function handleCheckoutCompleted(session) {
  try {
    console.log('✅ Checkout completado:', session.id);

    const tenantId = session.client_reference_id;
    const subscriptionId = session.subscription;

    if (!tenantId || !subscriptionId) {
      console.error('❌ Faltan datos en checkout session');
      return;
    }

    // Obtener detalles de la suscripción
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    const planId = subscription.metadata?.plan_id || 'pro';

    // Actualizar BD
    await updateSubscription(tenantId, {
      stripe_customer_id: session.customer,
      stripe_subscription_id: subscriptionId,
      plan: planId.toLowerCase(),
      status: 'active',
      current_period_start: subscription.current_period_start,
      current_period_end: subscription.current_period_end
    });

    // Enviar email de bienvenida
    const user = await getUserByTenantId(tenantId);
    if (user) {
      const amount = (subscription.items.data[0].price.unit_amount / 100).toFixed(2);
      await sendPaymentSuccessEmail(user.email, user.company_name, amount, planId);
    }

    console.log(`✅ Suscripción activada para tenant ${tenantId}`);
  } catch (error) {
    console.error('❌ Error procesando checkout:', error);
  }
}

/**
 * Pago exitoso - Renovación mensual/anual
 */
async function handlePaymentSucceeded(invoice) {
  try {
    console.log('💰 Pago exitoso:', invoice.id);

    const subscriptionId = invoice.subscription;
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    const customerId = subscription.customer;

    // Buscar tenant por customer_id
    const { getUserByStripeCustomer } = require('./db');
    const user = await getUserByStripeCustomer(customerId);

    if (!user) {
      console.error('❌ Usuario no encontrado para customer:', customerId);
      return;
    }

    // Actualizar estado
    await updateSubscription(user.tenant_id, {
      status: 'active',
      current_period_start: subscription.current_period_start,
      current_period_end: subscription.current_period_end
    });

    console.log(`✅ Pago procesado para ${user.email}`);
  } catch (error) {
    console.error('❌ Error procesando pago:', error);
  }
}

/**
 * Pago fallido - Tarjeta rechazada
 */
async function handlePaymentFailed(invoice) {
  try {
    console.log('⚠️ Pago fallido:', invoice.id);

    const subscriptionId = invoice.subscription;
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    const customerId = subscription.customer;

    const { getUserByStripeCustomer } = require('./db');
    const user = await getUserByStripeCustomer(customerId);

    if (!user) return;

    // Actualizar estado a past_due
    await updateSubscription(user.tenant_id, {
      status: 'past_due'
    });

    // Enviar email de aviso
    await sendPaymentFailedEmail(user.email, user.company_name);

    console.log(`⚠️ Usuario ${user.email} marcado como past_due`);
  } catch (error) {
    console.error('❌ Error procesando pago fallido:', error);
  }
}

/**
 * Suscripción actualizada - Cambio de plan
 */
async function handleSubscriptionUpdated(subscription) {
  try {
    console.log('🔄 Suscripción actualizada:', subscription.id);

    const customerId = subscription.customer;
    const { getUserByStripeCustomer } = require('./db');
    const user = await getUserByStripeCustomer(customerId);

    if (!user) return;

    const planId = subscription.metadata?.plan_id || 'pro';

    await updateSubscription(user.tenant_id, {
      plan: planId.toLowerCase(),
      status: subscription.status,
      current_period_start: subscription.current_period_start,
      current_period_end: subscription.current_period_end
    });

    console.log(`✅ Suscripción actualizada para ${user.email}`);
  } catch (error) {
    console.error('❌ Error actualizando suscripción:', error);
  }
}

/**
 * Suscripción cancelada
 */
async function handleSubscriptionDeleted(subscription) {
  try {
    console.log('🚫 Suscripción cancelada:', subscription.id);

    const customerId = subscription.customer;
    const { getUserByStripeCustomer } = require('./db');
    const user = await getUserByStripeCustomer(customerId);

    if (!user) return;

    await updateSubscription(user.tenant_id, {
      status: 'canceled',
      stripe_subscription_id: null
    });

    console.log(`✅ Suscripción cancelada para ${user.email}`);
  } catch (error) {
    console.error('❌ Error cancelando suscripción:', error);
  }
}

module.exports = router;
