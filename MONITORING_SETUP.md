# 📊 Sentry + Google Analytics Setup

## ✅ Completado

### 1️⃣ Google Analytics Eventos
Ya integrado en el código. Eventos trackeados:

- **sign_up** - Usuario completa registro
- **login** - Usuario inicia sesión
- **select_plan_click** - Click en botón "Seleccionar Plan"
- **begin_checkout** - Inicio proceso de pago
- **purchase** - Conversión exitosa (configurar en webhook de Stripe)

#### Ver Eventos en Google Analytics:
1. Ve a: https://analytics.google.com
2. **Reports** → **Engagement** → **Events**
3. Verás: `sign_up`, `begin_checkout`, `select_plan_click`

### 2️⃣ Sentry Error Tracking

#### Setup en Sentry.io:

1. **Crear cuenta**: https://sentry.io/signup/
2. **Crear proyecto**:
   - Nombre: `whop-recovery-frontend`
   - Platform: `React`
3. **Copiar DSN** (algo como `https://xxxxx@yyy.ingest.sentry.io/zzz`)

#### Configurar en Vercel:

1. **Vercel Dashboard** → Tu proyecto → **Settings** → **Environment Variables**
2. **Añadir variable**:
   ```
   Name: VITE_SENTRY_DSN
   Value: https://tu-dsn-de-sentry.ingest.sentry.io/12345
   Environment: Production
   ```
3. **Redeploy** → Sentry empezará a capturar errores

#### Configurar en Local (opcional):

Crea `.env` en `/frontend`:
```env
VITE_SENTRY_DSN=https://tu-dsn.ingest.sentry.io/12345
```

### 3️⃣ Webhooks de Stripe

#### Setup en Stripe:

1. **Stripe Dashboard**: https://dashboard.stripe.com/webhooks
2. **Add endpoint**:
   ```
   URL: https://pruebawhop-production.up.railway.app/api/webhooks/stripe
   Events: checkout.session.completed, invoice.payment_succeeded, invoice.payment_failed, customer.subscription.updated, customer.subscription.deleted
   ```
3. **Copiar Signing Secret** (wh sec_xxx)

#### Configurar en Railway:

1. **Railway** → Tu proyecto → **Variables**
2. **Añadir**:
   ```
   STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxx
   ```
3. **Redeploy**

#### Probar Webhooks (local):

```bash
# Instalar Stripe CLI
stripe listen --forward-to localhost:3000/api/webhooks/stripe

# En otra terminal, trigger evento de prueba
stripe trigger checkout.session.completed
```

### 4️⃣ Winston Logger

Ya configurado. Logs se guardan en:
- **Local**: `./logs/combined.log` y `./logs/error.log`
- **Railway**: `/data/logs/combined.log` y `/data/logs/error.log`

#### Ver logs en Railway:

```bash
# Railway CLI
railway logs

# O en Railway Dashboard → Deploy → View Logs
```

---

## 🧪 Testing

### Google Analytics:
```javascript
// En consola del navegador
gtag('event', 'test_event', { test: true });
```
Luego verifica en **Google Analytics → DebugView** (activa con extensión Google Analytics Debugger)

### Sentry:
```javascript
// En consola del navegador
throw new Error("Test Sentry");
```
Debería aparecer en Sentry dashboard en ~30 segundos.

### Webhooks:
```bash
curl -X POST https://pruebawhop-production.up.railway.app/api/webhooks/stripe \
  -H "Content-Type: application/json" \
  -d '{"test": true}'
```
Debería responder 400 (porque falta firma válida)

---

## 📊 Métricas a Monitorear

### Google Analytics:
- **Conversión signup → checkout**: Meta >10%
- **Tiempo en pricing page**: Usuarios interesados >30s
- **Bounce rate landing**: Meta <40%

### Sentry:
- **Error rate**: Meta <0.1%
- **Errors más frecuentes**: Priorizar fixes
- **Performance**: Pages que cargan >2s

### Logs (Winston):
- **Pagos procesados**: Revisar diario
- **Errores de Stripe**: Investigar ASAP
- **Webhooks fallidos**: Puede perder datos

---

**Estado actual**: ✅ Todo configurado, falta añadir API keys de Sentry
