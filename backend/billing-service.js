const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { updateSubscription, getUserByTenantId } = require('./db');
const { getPlan } = require('./plans');
const { 
  sendPaymentSuccessEmail, 
  sendPaymentFailedEmail: sendPaymentFailedEmailSG 
} = require('./email');

/**
 * Crea un Stripe Customer para un tenant
 */
async function createCustomer(email, tenantId, companyName) {
  try {
    const customer = await stripe.customers.create({
      email,
      metadata: {
        tenant_id: tenantId,
        company_name: companyName
      }
    });
    
    console.log(`✅ Stripe Customer creado: ${customer.id} para tenant ${tenantId}`);
    return customer;
  } catch (error) {
    console.error('Error creando Stripe Customer:', error);
    throw error;
  }
}

/**
 * Crea Checkout Session para upgrade de plan
 */
async function createCheckoutSession(tenantId, planId, customerEmail, successUrl, cancelUrl) {
  try {
    const plan = getPlan(planId);
    
    if (!plan.priceId) {
      throw new Error(`Plan ${planId} no tiene priceId configurado`);
    }
    
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: plan.priceId,
          quantity: 1
        }
      ],
      customer_email: customerEmail,
      client_reference_id: tenantId,
      metadata: {
        tenant_id: tenantId,
        plan_id: planId
      },
      success_url: successUrl,
      cancel_url: cancelUrl,
      subscription_data: {
        metadata: {
          tenant_id: tenantId,
          plan_id: planId
        }
      }
    });
    
    console.log(`✅ Checkout Session creada: ${session.id} para plan ${planId}`);
    return session;
  } catch (error) {
    console.error('Error creando Checkout Session:', error);
    throw error;
  }
}

/**
 * Crea Customer Portal Session para gestionar suscripción
 */
async function createPortalSession(customerId, returnUrl) {
  try {
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl
    });
    
    return session;
  } catch (error) {
    console.error('Error creando Portal Session:', error);
    throw error;
  }
}

/**
 * Cancela una suscripción
 */
async function cancelSubscription(subscriptionId) {
  try {
    const subscription = await stripe.subscriptions.cancel(subscriptionId);
    console.log(`✅ Suscripción cancelada: ${subscriptionId}`);
    return subscription;
  } catch (error) {
    console.error('Error cancelando suscripción:', error);
    throw error;
  }
}

/**
 * Verifica la firma del webhook de Stripe
 */
function verifyWebhook(rawBody, signature, secret) {
  try {
    const event = stripe.webhooks.constructEvent(rawBody, signature, secret);
    return event;
  } catch (err) {
    throw new Error(`Webhook signature verification failed: ${err.message}`);
  }
}

/**
 * Procesa webhook de Stripe Billing
 */
async function handleBillingWebhook(event) {
  try {
    switch (event.type) {
      // Checkout completado → Crear suscripción
      case 'checkout.session.completed': {
        const session = event.data.object;
        const tenantId = session.metadata.tenant_id || session.client_reference_id;
        const planId = session.metadata.plan_id;
        
        console.log(`✅ Checkout completado para tenant ${tenantId}, plan ${planId}`);
        
        // Actualizar DB con customer_id
        if (session.customer) {
          updateSubscription(tenantId, {
            stripe_customer_id: session.customer,
            status: 'active' // Se actualizará con subscription.created
          });
        }
        break;
      }
      
      // Suscripción creada
      case 'customer.subscription.created': {
        const subscription = event.data.object;
        const tenantId = subscription.metadata.tenant_id;
        const planId = subscription.metadata.plan_id;
        const plan = getPlan(planId);
        
        console.log(`✅ Suscripción creada: ${subscription.id} para tenant ${tenantId}`);
        
        updateSubscription(tenantId, {
          plan: planId,
          stripe_subscription_id: subscription.id,
          stripe_customer_id: subscription.customer,
          status: 'active',
          current_period_end: subscription.current_period_end,
          payments_limit: plan.paymentsLimit,
          payments_used: 0, // Reset al activar
          trial_ends_at: null // Ya no está en trial
        });
        break;
      }
      
      // Suscripción actualizada
      case 'customer.subscription.updated': {
        const subscription = event.data.object;
        const tenantId = subscription.metadata.tenant_id;
        
        console.log(`🔄 Suscripción actualizada: ${subscription.id}`);
        
        updateSubscription(tenantId, {
          status: subscription.status,
          current_period_end: subscription.current_period_end
        });
        break;
      }
      
      // Suscripción cancelada
      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        const tenantId = subscription.metadata.tenant_id;
        
        console.log(`❌ Suscripción cancelada: ${subscription.id} para tenant ${tenantId}`);
        
        // Downgrade a FREE
        updateSubscription(tenantId, {
          plan: 'free',
          stripe_subscription_id: null,
          status: 'canceled',
          current_period_end: null,
          payments_limit: 50,
          payments_used: 0
        });
        break;
      }
      
      // Pago de factura fallido
      case 'invoice.payment_failed': {
        const invoice = event.data.object;
        const customerId = invoice.customer;
        const subscription = invoice.subscription;
        
        console.log(`❌ Pago fallido para customer ${customerId}`);
        
        // Buscar tenant por subscription
        if (subscription) {
          const sub = await stripe.subscriptions.retrieve(subscription);
          const tenantId = sub.metadata.tenant_id;
          
          if (tenantId) {
            const user = getUserByTenantId(tenantId);
            if (user) {
              // Enviar email de pago fallido
              try {
                const failureReason = invoice.last_payment_error?.message || 'Tu método de pago fue rechazado';
                await sendPaymentFailedEmailSG(user.email, user.company_name, failureReason);
                console.log(`✅ Payment failed email sent to ${user.email}`);
              } catch (emailError) {
                console.error('❌ Error sending payment failed email:', emailError);
              }
            }
          }
        }
        break;
      }
      
      // Pago exitoso
      case 'invoice.payment_succeeded': {
        const invoice = event.data.object;
        const subscription = invoice.subscription;
        const amount = (invoice.amount_paid / 100).toFixed(2); // Convertir de centavos a euros
        
        if (subscription) {
          console.log(`✅ Pago exitoso para suscripción ${subscription}`);
          
          // Obtener información de la suscripción
          const sub = await stripe.subscriptions.retrieve(subscription);
          const tenantId = sub.metadata.tenant_id;
          const planId = sub.metadata.plan_id;
          
          if (tenantId) {
            const user = getUserByTenantId(tenantId);
            if (user) {
              // Enviar email de confirmación de pago
              try {
                await sendPaymentSuccessEmail(user.email, user.company_name, amount, planId);
                console.log(`✅ Payment success email sent to ${user.email}`);
              } catch (emailError) {
                console.error('❌ Error sending payment success email:', emailError);
              }
            }
          }
        }
        break;
      }
      
      default:
        console.log(`ℹ️ Evento no manejado: ${event.type}`);
    }
  } catch (error) {
    console.error('Error procesando webhook de billing:', error);
    throw error;
  }
}

module.exports = {
  createCustomer,
  createCheckoutSession,
  createPortalSession,
  cancelSubscription,
  verifyWebhook,
  handleBillingWebhook
};
