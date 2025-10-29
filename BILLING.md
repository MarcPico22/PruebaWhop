# Sistema de Suscripciones y Billing

## 📋 Descripción General

El sistema de suscripciones permite monetizar la plataforma Whop Retry cobrando mensualmente a las empresas por el servicio de recuperación de pagos. Se integra con Stripe Billing para procesar pagos recurrentes y gestionar el ciclo de vida de las suscripciones.

## 🎯 Planes Disponibles

### FREE (Gratis)
- **Precio**: $0/mes
- **Límite**: 50 pagos/mes
- **Trial**: 14 días gratis
- **Características**:
  - Dashboard básico
  - Estadísticas en tiempo real
  - Recuperación automática de pagos
  - Soporte por email

### PRO ($49/mes)
- **Precio**: $49/mes
- **Límite**: 500 pagos/mes
- **Características**:
  - Todo lo de FREE +
  - Webhook personalizable
  - Exportación CSV ilimitada
  - Integraciones avanzadas
  - Soporte prioritario

### ENTERPRISE ($199/mes)
- **Precio**: $199/mes
- **Límite**: Pagos ilimitados
- **Características**:
  - Todo lo de PRO +
  - Pagos ilimitados
  - SLA garantizado
  - Account manager dedicado
  - Soporte 24/7
  - Configuración personalizada

## 🏗️ Arquitectura del Sistema

### Backend

```
backend/
├── db.js                          # Base de datos SQLite
│   ├── subscriptions (tabla)     # Suscripciones de tenants
│   ├── getSubscription()         # Auto-crea FREE trial
│   ├── updateSubscription()      # Actualiza plan y límites
│   ├── incrementPaymentsUsed()   # Contador de uso
│   └── resetPaymentsUsed()       # Reset mensual
│
├── plans.js                       # Definición de planes
│   ├── PLANS (object)            # FREE, PRO, ENTERPRISE
│   ├── canProcessPayment()       # Validación de límites
│   ├── getUsagePercentage()      # Cálculo de uso
│   └── shouldShowLimitWarning()  # Alertas 80%+
│
├── subscription-middleware.js     # Express middleware
│   ├── checkPlanLimits()         # Bloquea requests (403)
│   ├── trackPaymentUsage()       # Incrementa contador
│   ├── attachSubscription()      # Adjunta info al req
│   ├── checkPlanLimitsWebhook()  # Para webhooks externos
│   └── trackPaymentUsageWebhook()# Para webhooks
│
├── billing-service.js             # Integración Stripe
│   ├── createCheckoutSession()   # Checkout de upgrade
│   ├── createPortalSession()     # Customer Portal
│   └── handleBillingWebhook()    # Eventos de Stripe
│
└── routes.js                      # API endpoints
    ├── GET  /api/subscription    # Info de suscripción
    ├── GET  /api/plans           # Lista de planes
    ├── POST /api/create-checkout # Iniciar upgrade
    ├── POST /api/create-portal   # Gestionar suscripción
    └── POST /webhook/stripe-billing # Webhook de Stripe
```

### Frontend

```
frontend/src/
├── Pricing.jsx       # Página de pricing (3 cards)
├── Pricing.css       # Estilos de pricing
├── Dashboard.jsx     # Banner de límites (modificado)
└── main.jsx          # Ruta /pricing agregada
```

## 🔄 Flujo de Suscripción

### 1. Registro Nuevo Usuario
1. Usuario se registra en `/signup`
2. Sistema crea automáticamente suscripción FREE con trial de 14 días
3. Contador `payments_used` empieza en 0
4. Límite inicial: 50 pagos/mes

### 2. Trial Period (14 días)
- Usuario puede usar el sistema gratis
- Límite de 50 pagos/mes
- Dashboard muestra banner azul: "Trial gratuito activo - X días restantes"
- Al final del trial, si no actualiza → sigue en FREE (sin trial)

### 3. Upgrade a Plan Pago
**Flujo del usuario:**
1. Usuario hace clic en "Actualizar Plan" en Dashboard o va a `/pricing`
2. Selecciona PRO o ENTERPRISE
3. Sistema llama a `POST /api/create-checkout`
4. Redirige a Stripe Checkout
5. Usuario ingresa datos de pago
6. Stripe procesa el pago
7. Webhook `checkout.session.completed` → Sistema actualiza plan
8. Usuario es redirigido a `/dashboard?upgrade=success`
9. Límite aumenta automáticamente (PRO=500, ENTERPRISE=∞)

**Código backend:**
```javascript
// routes.js
router.post('/api/create-checkout', authenticateToken, async (req, res) => {
  const { planId } = req.body;
  const tenantId = req.user.tenantId;
  const subscription = getSubscription(tenantId);
  
  const session = await createBillingCheckout(
    tenantId,
    planId,
    req.user.email,
    successUrl,
    cancelUrl
  );
  
  res.json({ url: session.url });
});
```

### 4. Límites y Bloqueo
**Cuando usuario alcanza 80% del límite:**
- Dashboard muestra banner amarillo de advertencia
- Botón "Actualizar Plan"

**Cuando usuario alcanza 100% del límite:**
- Dashboard muestra banner rojo "Límite alcanzado"
- `POST /seed-test-payment` devuelve **403 Forbidden**
- Webhook `/webhook/whop` devuelve **403 Forbidden**
- Usuario DEBE actualizar plan para continuar

**Código middleware:**
```javascript
// subscription-middleware.js
function checkPlanLimits(req, res, next) {
  const tenantId = req.user?.tenantId;
  const subscription = getSubscription(tenantId);
  const check = canProcessPayment(subscription);
  
  if (!check.allowed) {
    return res.status(403).json({
      error: 'Límite alcanzado',
      message: check.message,
      upgradeUrl: '/pricing'
    });
  }
  
  next();
}
```

### 5. Renovación Mensual
- Stripe cobra automáticamente cada mes
- Webhook `invoice.payment_succeeded` → Sistema confirma pago
- Contador `payments_used` se resetea a 0
- Usuario puede volver a procesar pagos

### 6. Pago Fallido
- Stripe intenta cobrar → falla
- Webhook `invoice.payment_failed` → Sistema notifica al usuario
- Subscription.status → `past_due`
- Usuario tiene algunos días para actualizar método de pago
- Si no paga → Stripe cancela automáticamente

### 7. Cancelación de Suscripción
**Flujo del usuario:**
1. Usuario hace clic en "Gestionar Suscripción"
2. Sistema llama a `POST /api/create-portal`
3. Redirige a Stripe Customer Portal
4. Usuario cancela suscripción
5. Webhook `customer.subscription.deleted` → Sistema recibe evento
6. Sistema downgrade a plan FREE
7. Límite reduce a 50 pagos/mes
8. Si `payments_used > 50` → usuario bloqueado hasta próximo mes

**Código webhook:**
```javascript
// billing-service.js
case 'customer.subscription.deleted':
  updateSubscription(tenantId, {
    plan: 'free',
    status: 'cancelled',
    stripe_subscription_id: null,
    payments_limit: 50
  });
  break;
```

## 🌐 Webhooks de Stripe

### Configuración
1. Ve a Stripe Dashboard → Developers → Webhooks
2. Agrega endpoint: `https://tudominio.com/webhook/stripe-billing`
3. Selecciona eventos:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_failed`
   - `invoice.payment_succeeded`
4. Copia el Webhook Secret → `.env` como `STRIPE_BILLING_WEBHOOK_SECRET`

### Eventos Procesados

| Evento | Descripción | Acción del Sistema |
|--------|-------------|-------------------|
| `checkout.session.completed` | Usuario completó checkout | Log del evento |
| `customer.subscription.created` | Suscripción activada | Actualiza plan en DB |
| `customer.subscription.updated` | Cambio en suscripción | Sincroniza status |
| `customer.subscription.deleted` | Suscripción cancelada | Downgrade a FREE |
| `invoice.payment_failed` | Pago mensual falló | Notifica al usuario |
| `invoice.payment_succeeded` | Pago mensual exitoso | Resetea contador |

## 🔐 Variables de Entorno

### Requeridas
```bash
# Stripe Billing (para cobrar a las empresas)
STRIPE_SECRET_KEY=sk_live_...
STRIPE_BILLING_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_ID_PRO=price_...
STRIPE_PRICE_ID_ENTERPRISE=price_...
```

### Configuración en Stripe Dashboard

1. **Crear Productos:**
   - Stripe Dashboard → Products → Add product
   - Nombre: "Whop Retry PRO"
   - Price: $49/month recurring
   - Copiar Price ID → `.env` como `STRIPE_PRICE_ID_PRO`
   - Repetir para ENTERPRISE ($199/month)

2. **Configurar Webhook:**
   - Developers → Webhooks → Add endpoint
   - URL: `https://tudominio.com/webhook/stripe-billing`
   - Events to send: billing-related events
   - Copiar Secret → `.env` como `STRIPE_BILLING_WEBHOOK_SECRET`

## 📊 Base de Datos

### Tabla `subscriptions`

```sql
CREATE TABLE IF NOT EXISTS subscriptions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tenant_id INTEGER UNIQUE NOT NULL,
  plan TEXT DEFAULT 'free',  -- free, pro, enterprise
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  status TEXT DEFAULT 'active',  -- active, trialing, past_due, cancelled
  trial_ends_at INTEGER,
  current_period_end INTEGER,
  payments_limit INTEGER DEFAULT 50,
  payments_used INTEGER DEFAULT 0,
  created_at INTEGER DEFAULT (strftime('%s', 'now')),
  FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);
```

### Campos Importantes

- **plan**: `free`, `pro`, `enterprise`
- **status**: `trialing`, `active`, `past_due`, `cancelled`
- **payments_limit**: Límite mensual de pagos (50, 500, -1=ilimitado)
- **payments_used**: Contador actual del mes
- **trial_ends_at**: Timestamp cuando termina trial (14 días)
- **current_period_end**: Timestamp cuando termina periodo actual

## 🧪 Testing

### Flujo Completo

```bash
# 1. Registrar nuevo usuario
POST /signup
{
  "email": "test@empresa.com",
  "password": "password",
  "company_name": "Test Inc"
}

# 2. Verificar trial creado
GET /api/subscription
Authorization: Bearer <token>

Response:
{
  "plan": "free",
  "status": "trialing",
  "paymentsUsed": 0,
  "paymentsLimit": 50,
  "daysUntilTrialEnd": 14,
  "usagePercentage": 0
}

# 3. Crear 40 pagos de prueba
for i in {1..40}; do
  POST /seed-test-payment
  Authorization: Bearer <token>
done

# 4. Verificar advertencia (80%)
GET /api/subscription
Response:
{
  "paymentsUsed": 40,
  "paymentsLimit": 50,
  "usagePercentage": 80,
  "showWarning": true
}

# 5. Crear 10 pagos más (alcanzar límite)
for i in {1..10}; do
  POST /seed-test-payment
done

# 6. Intentar crear otro pago (debe fallar)
POST /seed-test-payment
Response: 403 Forbidden
{
  "error": "Límite alcanzado",
  "message": "Has alcanzado el límite de 50 pagos del plan FREE",
  "upgradeUrl": "/pricing"
}

# 7. Actualizar a PRO
POST /api/create-checkout
{
  "planId": "pro",
  "successUrl": "http://localhost:5173/dashboard",
  "cancelUrl": "http://localhost:5173/pricing"
}

Response:
{
  "url": "https://checkout.stripe.com/pay/cs_test_..."
}

# 8. Completar pago en Stripe → Webhook automático actualiza plan

# 9. Verificar nuevo límite
GET /api/subscription
Response:
{
  "plan": "pro",
  "status": "active",
  "paymentsLimit": 500,
  "paymentsUsed": 50
}
```

### Testing con Stripe CLI

```bash
# Escuchar webhooks localmente
stripe listen --forward-to localhost:3000/webhook/stripe-billing

# Trigger evento de prueba
stripe trigger checkout.session.completed
```

## 🚀 Despliegue en Producción

### Checklist

- [ ] Configurar productos en Stripe (PRO y ENTERPRISE)
- [ ] Copiar Price IDs a `.env`
- [ ] Configurar webhook en Stripe Dashboard
- [ ] Copiar Webhook Secret a `.env`
- [ ] Actualizar `BASE_URL` en `.env`
- [ ] Verificar que STRIPE_SECRET_KEY es de producción (`sk_live_...`)
- [ ] Test completo en modo producción
- [ ] Monitorear webhook logs en Stripe Dashboard

### URLs de Producción

```bash
# .env
BASE_URL=https://tudominio.com
STRIPE_SECRET_KEY=sk_live_...
STRIPE_BILLING_WEBHOOK_SECRET=whsec_...
```

## 📈 Próximas Mejoras (Roadmap)

### Fase 2: Integración Whop API
- Auto-sincronización de pagos fallidos desde Whop
- Eliminar necesidad de "crear pago de prueba"
- Webhook de Whop en tiempo real
- Cron job para sync periódico

### Fase 3: Features Avanzados
- Analytics avanzados (ROI, recovery rate por producto)
- A/B testing de emails de recuperación
- Personalización de intervalos de reintento por plan
- API pública para integraciones

### Fase 4: Escalabilidad
- Migración a PostgreSQL
- Redis para cache
- Queue system (BullMQ) para procesamiento async
- Multi-region deployment

## 🐛 Troubleshooting

### Usuario bloqueado pero tiene pagos disponibles
```javascript
// Resetear contador manualmente
const { resetPaymentsUsed } = require('./db');
resetPaymentsUsed(tenantId);
```

### Webhook no se está recibiendo
1. Verificar URL en Stripe Dashboard
2. Verificar STRIPE_BILLING_WEBHOOK_SECRET en .env
3. Ver logs: `stripe listen --forward-to localhost:3000/webhook/stripe-billing`
4. Verificar firewall permite POST a /webhook/stripe-billing

### Plan no se actualiza después de pago
1. Verificar webhook logs en Stripe Dashboard
2. Verificar logs backend: `console.log` en handleBillingWebhook
3. Verificar metadata en Stripe Customer tiene `tenantId`

### Trial no se crea al registrar
1. Verificar función `getSubscription()` en db.js
2. Verificar tabla subscriptions existe: `SELECT * FROM subscriptions;`
3. Verificar log: "✅ Suscripción FREE trial creada para tenant X"

## 📚 Referencias

- [Stripe Billing Docs](https://stripe.com/docs/billing)
- [Stripe Webhooks](https://stripe.com/docs/webhooks)
- [Stripe Customer Portal](https://stripe.com/docs/billing/subscriptions/customer-portal)
- [Stripe Checkout](https://stripe.com/docs/payments/checkout)

---

**Autor**: Marc P  
**Versión**: 1.0.0 (Fase 1 completada)  
**Fecha**: 2024
