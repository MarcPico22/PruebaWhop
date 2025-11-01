# 🚀 ACCIÓN REQUERIDA - Variables de Entorno

## ✅ YA CONFIGURADO EN CÓDIGO
El código ya está listo para usar Sentry y Stripe Webhooks.

## ⚙️ CONFIGURAR EN RAILWAY (Backend)

**Ve a**: https://railway.app → Tu proyecto → Variables

**Añade esta variable:**
```
STRIPE_WEBHOOK_SECRET=whsec_gg8KWfwYNviTg7WIvb3XuKNxiv7SqVyn
```

**Luego haz Redeploy:**
- Railway automáticamente redeployará
- O manualmente: Deploy → Redeploy

---

## ⚙️ CONFIGURAR EN VERCEL (Frontend)

**Ve a**: https://vercel.com/dashboard → Tu proyecto → Settings → Environment Variables

**Añade esta variable:**
```
Name: VITE_SENTRY_DSN
Value: https://510e483f358575a0f56467f9fb085910@o4510290182864896.ingest.de.sentry.io/4510290200363088
Environment: Production
```

**Luego haz Redeploy:**
- Vercel → Deployments → Latest → Redeploy

---

## ✅ VERIFICAR QUE FUNCIONA

### 1️⃣ Sentry (después de redeploy de Vercel):
```javascript
// En consola del navegador en whoprecovery.com
throw new Error("Test Sentry desde producción");
```
Debería aparecer en https://sentry.io en ~30 segundos.

### 2️⃣ Stripe Webhooks (después de redeploy de Railway):
```bash
# Ver logs de Railway
# Deberías ver: "Webhook recibido: checkout.session.completed"
# cuando alguien complete un pago
```

---

## 📋 CHECKLIST

- [ ] Railway → Variables → `STRIPE_WEBHOOK_SECRET` añadida
- [ ] Railway → Redeploy completado
- [ ] Vercel → Environment Variables → `VITE_SENTRY_DSN` añadida
- [ ] Vercel → Redeploy completado
- [ ] Test Sentry: Lanzar error en consola → Aparece en Sentry.io
- [ ] Test Webhook: Hacer pago de prueba → Ver log en Railway

---

**Tiempo estimado**: 5 minutos
**Estado actual**: Variables listas, falta añadirlas en dashboards
