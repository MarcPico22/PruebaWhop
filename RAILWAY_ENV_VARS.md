# 🚂 Variables de Entorno para Railway

## 📋 Copiar EXACTAMENTE estas variables en Railway

Ve a: **Railway → Tu Proyecto → Variables → Raw Editor**

```env
# ====================
# CONFIGURACIÓN BÁSICA
# ====================
PORT=3000
BASE_URL=https://www.whoprecovery.com
RETRY_INTERVALS=60,300,900

# ====================
# SEGURIDAD
# ====================
JWT_SECRET=your_jwt_secret_here
ENCRYPTION_SECRET=your_encryption_secret_here

# ====================
# STRIPE - BILLING & SUSCRIPCIONES (LIVE MODE)
# ====================
STRIPE_SECRET_KEY=sk_live_YOUR_STRIPE_KEY_HERE

# Webhook Secret (Stripe Dashboard → Developers → Webhooks)
# ⚠️ USA ESTE: https://pruebawhop-production.up.railway.app/api/webhooks/stripe
STRIPE_BILLING_WEBHOOK_SECRET=whsec_YOUR_WEBHOOK_SECRET_HERE

# PRO PLAN (€49/mes - €499/año)
STRIPE_PRICE_MONTHLY_PRO=price_YOUR_MONTHLY_PRO_PRICE_ID
STRIPE_PRICE_YEARLY_PRO=price_YOUR_YEARLY_PRO_PRICE_ID

# ENTERPRISE PLAN (€199/mes - €2,099/año)
STRIPE_PRICE_MONTHLY_ENTERPRISE=price_YOUR_MONTHLY_ENTERPRISE_PRICE_ID
STRIPE_PRICE_YEARLY_ENTERPRISE=price_YOUR_YEARLY_ENTERPRISE_PRICE_ID

# ====================
# SENDGRID - EMAILS
# ====================
SENDGRID_API_KEY=SG.YOUR_SENDGRID_API_KEY_HERE
FROM_EMAIL=your-email@example.com
SUPPORT_EMAIL=support@example.com

# ====================
# BASE DE DATOS
# ====================
# Railway usa volumen en /data
DATABASE_URL=/data/database.sqlite
```

---

## ⚠️ IMPORTANTE: Configuración de Secrets

**NO COMPARTAS** tus API keys reales en GitHub. Los valores arriba son placeholders.

Para configurar en Railway:
1. Ve a Railway Dashboard → Tu Proyecto → Variables
2. Copia y pega tus valores REALES (guárdalos en un lugar seguro fuera de Git)
3. Railway encripta automáticamente las variables

---

## ✅ Checklist de Configuración Railway

### 1. **Copiar Variables**
- [ ] Ve a Railway → Tu Proyecto → Variables
- [ ] Click en "Raw Editor"
- [ ] Pega TODO el bloque de arriba
- [ ] Click "Deploy" (se redesplegará automáticamente)

### 2. **Verificar Volumen**
- [ ] Railway → Settings → Volumes
- [ ] Debe existir volumen montado en `/data`
- [ ] Size: 1GB mínimo

### 3. **Configurar Webhook en Stripe**
- [ ] Ve a: https://dashboard.stripe.com/webhooks
- [ ] **VERIFICA** que existe este webhook:
  - URL: `https://pruebawhop-production.up.railway.app/api/webhooks/stripe`
  - Eventos (5): `checkout.session.completed`, `invoice.payment_succeeded`, `invoice.payment_failed`, `customer.subscription.updated`, `customer.subscription.deleted`
  - Secret: `whsec_gg8KWfwYNviTg7WIvb3XuKNxiv7SqVyn`
- [ ] **ELIMINA** webhooks duplicados (si existen)
- [ ] **IMPORTANTE**: El backend usa la variable `STRIPE_BILLING_WEBHOOK_SECRET`
- [ ] **ELIMINA** la variable `STRIPE_WEBHOOK_SECRET` de Railway (no se usa)

### 4. **Verificar Deploy**
Después de guardar las variables, Railway redesplegará automáticamente.

Verifica en los logs:
```
✅ Base de datos conectada: /data/database.sqlite
✅ Base de datos inicializada
🚀 Whop Retry MVP - Backend iniciado
📡 Servidor corriendo en http://localhost:3000
⏰ Scheduler de reintentos iniciado
⏰ Whop Sync Scheduler iniciado
```

---

## 🔥 IMPORTANTE: Webhook de Stripe

El webhook secret `whsec_7ZLwWovhP3wWAqSSG5xjvhN4YXoLfGsh` es del webhook que YA CREASTE.

**Si creas un webhook NUEVO**, el secret cambiará. En ese caso:

1. Copia el nuevo secret de Stripe
2. Actualiza `STRIPE_BILLING_WEBHOOK_SECRET` en Railway
3. Redeploy

---

## 🚨 Troubleshooting

### Error: "No such price: 'price_1SOix2GAM4iQRKRwu0qNJZAr'"
- Verifica que el Price ID existe en Stripe Dashboard
- Asegúrate de estar en el mismo modo (Test/Live) que la API Key

### Error: "API key does not start with SG."
- Necesitas configurar `SENDGRID_API_KEY` válida
- Temporalmente no afecta la funcionalidad (emails no se enviarán)

### Error: "Database not found"
- Verifica que el volumen esté montado en `/data`
- Revisa `DATABASE_URL=/data/database.sqlite`

### Webhook no recibe eventos
- Verifica la URL del webhook en Stripe Dashboard
- Debe ser: `https://pruebawhop-production.up.railway.app/api/webhooks/stripe`
- Revisa el `STRIPE_BILLING_WEBHOOK_SECRET`

---

## 📊 Monitoreo

Una vez todo configurado, verifica:

1. **Sentry**: https://sentry.io → Whop Recovery project
2. **Stripe Dashboard**: https://dashboard.stripe.com
3. **Railway Logs**: Railway → Tu Proyecto → Deployments → Ver logs
4. **Google Analytics**: https://analytics.google.com

