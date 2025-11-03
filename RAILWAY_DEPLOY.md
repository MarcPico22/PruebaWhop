# 🚂 Railway Deployment Guide

## ✅ ESTADO ACTUAL

**Deployment**: ✅ Funcionando 100%  
**Migraciones**: ✅ Ejecutadas  
**URL**: https://pruebawhop-production.up.railway.app

---

## 🔧 CONFIGURACIÓN

### 1. Variables de Entorno

En Railway Dashboard → Backend Service → Variables:

```env
# === BÁSICO ===
PORT=3000
NODE_ENV=production
BASE_URL=https://www.whoprecovery.com
RETRY_INTERVALS=60,300,900

# === SEGURIDAD ===
JWT_SECRET=your_jwt_secret_here
ENCRYPTION_SECRET=your_encryption_secret_here

# === STRIPE (Live Mode) ===
STRIPE_SECRET_KEY=sk_live_xxx
STRIPE_BILLING_WEBHOOK_SECRET=whsec_xxx
STRIPE_PRICE_MONTHLY_PRO=price_xxx
STRIPE_PRICE_YEARLY_PRO=price_xxx
STRIPE_PRICE_MONTHLY_ENTERPRISE=price_xxx
STRIPE_PRICE_YEARLY_ENTERPRISE=price_xxx

# === SENDGRID ===
SENDGRID_API_KEY=SG.xxx
FROM_EMAIL=noreply@whoprecovery.com
SUPPORT_EMAIL=support@whoprecovery.com

# === BASE DE DATOS ===
DATABASE_URL=/data/database.sqlite
RAILWAY_ENVIRONMENT=true
```

### 2. Volumen Persistente

Railway → Settings → Volumes:
- **Mount Path**: `/data`
- **Size**: 1GB mínimo

### 3. Webhooks de Stripe

URL: `https://pruebawhop-production.up.railway.app/api/webhooks/stripe`

Eventos:
- `checkout.session.completed`
- `invoice.payment_succeeded`
- `invoice.payment_failed`
- `customer.subscription.updated`
- `customer.subscription.deleted`

---

## 🚀 COMANDOS ÚTILES

### Ejecutar Migraciones
```bash
railway run node backend/run-migrations.js
```

### Ver Logs
```bash
railway logs
```

### Conectar a Shell
```bash
railway shell
```

### Redeploy
```bash
railway up
```

---

## ✅ CHECKLIST DEPLOYMENT

- [x] Variables de entorno configuradas
- [x] Volumen /data montado
- [x] Webhook de Stripe configurado
- [x] Migraciones ejecutadas
- [x] Base de datos inicializada
- [x] Logs verificados
- [x] Frontend conectado

---

## 📊 MONITOREO

### Railway Dashboard
- CPU Usage
- Memory Usage
- Request Count
- Error Rate

### External
- **Sentry**: Error tracking
- **Google Analytics**: User analytics
- **Stripe Dashboard**: Payments

---

**Última actualización**: 3 Nov 2025
