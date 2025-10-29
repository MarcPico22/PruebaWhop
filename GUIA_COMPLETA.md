# 🎉 SISTEMA COMPLETO - Guía de Prueba y Deploy

## ✅ Estado del Proyecto

### FASE 1: Sistema de Suscripciones (100% COMPLETADO)
- ✅ Backend: Base de datos, planes, middleware, Stripe Billing
- ✅ Frontend: Página de pricing, banners de límites
- ✅ Documentación: BILLING.md, SETUP_STRIPE.md

### FASE 2: Integración Whop API (100% COMPLETADO)
- ✅ Servicio de Whop API (whop-service.js)
- ✅ Webhook en tiempo real (/webhook/whop-sync/:tenantId)
- ✅ Sincronización manual (botón en Dashboard)
- ✅ Cron job automático (cada 5 minutos)
- ✅ UI de configuración en frontend

---

## 🚀 GUÍA PASO A PASO PARA PROBAR TODO

### PASO 1: Configurar Stripe Billing (15 minutos)

**Lee y sigue:** `SETUP_STRIPE.md`

Resumen:
1. Accede a https://dashboard.stripe.com/ (modo TEST)
2. Crea 2 productos:
   - Whop Retry PRO: $49/mes
   - Whop Retry ENTERPRISE: $199/mes
3. Copia los Price IDs
4. Crea webhook apuntando a: `http://localhost:3000/webhook/stripe-billing`
5. Copia el Webhook Secret
6. Actualiza `backend/.env` con los 4 valores:
   ```bash
   STRIPE_SECRET_KEY=sk_test_...
   STRIPE_BILLING_WEBHOOK_SECRET=whsec_...
   STRIPE_PRICE_ID_PRO=price_...
   STRIPE_PRICE_ID_ENTERPRISE=price_...
   ```

### PASO 2: Iniciar el Sistema (5 minutos)

**Terminal 1: Backend**
```powershell
cd C:\Users\marcp\Desktop\Prueba\backend
npm start
```

Deberías ver:
```
✅ Base de datos inicializada
🚀 Whop Retry MVP - Backend iniciado
⏰ Scheduler de reintentos iniciado
⏰ Whop Sync Scheduler iniciado (cada 5 minutos)
```

**Terminal 2: Frontend**
```powershell
cd C:\Users\marcp\Desktop\Prueba\frontend
npm run dev
```

Accede a: http://localhost:5173

### PASO 3: Probar Flujo de Suscripciones (30 minutos)

#### 3.1 Registro y Trial Gratuito

1. Ve a http://localhost:5173/signup
2. Registra una cuenta:
   ```
   Email: test@empresa.com
   Password: password123
   Company: Test Inc
   ```
3. Inicia sesión
4. Verás el banner azul: **"Trial gratuito activo - 14 días restantes"**

#### 3.2 Verificar Límites

5. Ve a Dashboard → Configuración → Settings
6. Haz clic en "🧪 Crear pago de prueba" **40 veces**
7. Verás el banner amarillo: **"Has usado 40/50 pagos (80%)"**
8. Haz clic 10 veces más
9. Verás el banner rojo: **"Límite alcanzado"**
10. Intenta crear otro pago → **Error 403 Forbidden**

#### 3.3 Upgrade a Plan PRO

11. Haz clic en "Actualizar Ahora" en el banner rojo
12. Redirige a `/pricing`
13. Haz clic en "Actualizar" en la card de PRO
14. Redirige a Stripe Checkout
15. Usa tarjeta de prueba: `4242 4242 4242 4242`, MM/AA: 12/34, CVC: 123
16. Completa el pago
17. Webhook de Stripe actualiza el plan automáticamente
18. Vuelves al Dashboard y ves:
    - Plan actualizado a PRO
    - Límite: 500 pagos
    - Puedes volver a crear pagos

#### 3.4 Gestión de Suscripción

19. Ve a `/pricing`
20. Haz clic en "Gestionar Suscripción"
21. Redirige a Stripe Customer Portal
22. Cancela la suscripción
23. Webhook downgrade a FREE
24. Límite vuelve a 50 pagos

### PASO 4: Probar Integración Whop (30 minutos)

#### 4.1 Configurar Whop API

**NOTA:** Si no tienes acceso a una cuenta de Whop, puedes simular esto con datos de prueba.

1. Ve a Dashboard → Configuración → Integraciones
2. Click en tab "🔄 Whop API"
3. Ingresa tu Whop API Key
4. Click "Guardar Whop API"

#### 4.2 Sincronización Manual

5. Después de guardar, verás el botón "🔄 Sincronizar Ahora"
6. Haz clic
7. El sistema importará todos los pagos fallidos desde Whop
8. Verás mensaje: "✅ Sincronización completada: X pagos nuevos importados"
9. Ve a Dashboard → verás los pagos importados

#### 4.3 Webhook en Tiempo Real (Opcional)

10. Ve a Whop Dashboard → Settings → Webhooks
11. Crea nuevo webhook:
    ```
    URL: http://localhost:3000/webhook/whop-sync/TU_TENANT_ID
    Evento: payment.failed
    ```
12. Cuando ocurra un pago fallido en Whop, se agregará automáticamente

#### 4.4 Cron Job Automático

13. El cron job ya está corriendo (cada 5 minutos)
14. Verás en logs del backend:
    ```
    🔄 [CRON] Iniciando sincronización automática...
    ✅ [CRON] Sincronización completada: X pagos nuevos
    ```

### PASO 5: Verificar Flujo Completo End-to-End (15 minutos)

#### Escenario Realista:

1. **Empresa se registra** → Trial de 14 días (FREE - 50 pagos)
2. **Configura Whop API** en Integraciones
3. **Sistema sincroniza** pagos fallidos automáticamente
4. **Empresa procesa 45 pagos** → Ver warning amarillo
5. **Empresa actualiza a PRO** ($49/mes) → 500 pagos/mes
6. **Sistema sigue sincronizando** cada 5 minutos
7. **Empresa recupera pagos** con el sistema
8. **Empresa cancela** → Downgrade a FREE

---

## 🧪 Testing con Stripe CLI (Recomendado)

### Instalar Stripe CLI

1. Descarga: https://stripe.com/docs/stripe-cli
2. Instala en Windows
3. Abre PowerShell:

```powershell
stripe login
```

### Escuchar Webhooks Localmente

```powershell
stripe listen --forward-to localhost:3000/webhook/stripe-billing
```

Esto te dará un webhook signing secret temporal. Cópialo y úsalo en `.env`:

```bash
STRIPE_BILLING_WEBHOOK_SECRET=whsec_...
```

### Trigger Webhooks de Prueba

```powershell
# Simular upgrade exitoso
stripe trigger checkout.session.completed

# Simular activación de suscripción
stripe trigger customer.subscription.created

# Simular pago fallido
stripe trigger invoice.payment_failed

# Simular cancelación
stripe trigger customer.subscription.deleted
```

Verás en logs del backend cómo se procesan los eventos.

---

## 📊 Verificar Base de Datos

Para ver el estado de la base de datos:

```powershell
cd C:\Users\marcp\Desktop\Prueba\backend
sqlite3 data.db
```

Comandos útiles:

```sql
-- Ver todos los usuarios/tenants
SELECT * FROM users;

-- Ver suscripciones
SELECT tenant_id, plan, status, payments_limit, payments_used FROM subscriptions;

-- Ver integraciones
SELECT tenant_id, is_stripe_connected, is_sendgrid_connected, is_whop_connected FROM tenant_integrations;

-- Ver pagos
SELECT id, email, product, amount, status, retries FROM payments;

-- Salir
.quit
```

---

## 🐛 Troubleshooting

### Error: "Invalid API Key" en Stripe

**Problema:** La secret key no es válida

**Solución:**
1. Verifica que copiaste la key correctamente en `.env`
2. Asegúrate de estar en modo TEST (key empieza con `sk_test_`)
3. Reinicia el backend después de cambiar `.env`

### Webhook no se recibe

**Problema:** Backend no recibe eventos de Stripe

**Solución:**
1. Usa Stripe CLI para forward: `stripe listen --forward-to localhost:3000/webhook/stripe-billing`
2. Verifica que el backend esté corriendo
3. Verifica que el webhook secret sea correcto

### Límite no se actualiza después de upgrade

**Problema:** Plan se actualiza pero límite sigue en 50

**Solución:**
1. Verifica logs del backend para ver si el webhook se procesó
2. Consulta la tabla subscriptions en SQLite
3. Verifica que el webhook tenga el evento `customer.subscription.created`

### Whop sync no funciona

**Problema:** Sincronización falla o no encuentra pagos

**Solución:**
1. Verifica que la API key de Whop sea válida
2. Verifica que Whop tenga pagos fallidos disponibles
3. Ve a logs del backend para ver errores específicos
4. Prueba el endpoint manualmente con Postman

### Frontend no muestra datos

**Problema:** Dashboard vacío o sin suscripción

**Solución:**
1. Abre DevTools (F12) → Console para ver errores
2. Verifica que el backend esté corriendo en puerto 3000
3. Verifica que el token JWT esté guardado en localStorage
4. Cierra sesión y vuelve a iniciar

---

## 🚀 Deploy a Producción

### Checklist Pre-Deploy

- [ ] Cambiar todas las keys de TEST a LIVE en Stripe
- [ ] Actualizar `.env` con keys de producción
- [ ] Cambiar `BASE_URL` a tu dominio real
- [ ] Configurar webhook en Stripe con URL de producción
- [ ] Configurar SSL/HTTPS
- [ ] Configurar variables de entorno en servidor
- [ ] Probar flujo completo en staging primero

### Variables de Entorno (Producción)

```bash
# General
PORT=3000
BASE_URL=https://tudominio.com

# Billing
STRIPE_SECRET_KEY=sk_live_...
STRIPE_BILLING_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_ID_PRO=price_...
STRIPE_PRICE_ID_ENTERPRISE=price_...

# Security
JWT_SECRET=<generar uno nuevo con crypto.randomBytes>
ENCRYPTION_SECRET=<generar uno nuevo>
```

### Plataformas Recomendadas

**Backend:**
- Railway (https://railway.app) - Fácil, $5/mes
- Heroku (https://heroku.com) - Gratis para empezar
- DigitalOcean (https://digitalocean.com) - $5/mes

**Frontend:**
- Vercel (https://vercel.com) - Gratis
- Netlify (https://netlify.com) - Gratis
- Cloudflare Pages - Gratis

**Base de Datos:**
- SQLite funciona bien para empezar
- Migrar a PostgreSQL cuando tengas >100 empresas

---

## 📈 Métricas a Monitorear

### Dashboard de Negocio

- Usuarios registrados
- Trials activos
- Conversiones FREE → PRO
- Conversiones FREE → ENTERPRISE
- Churn rate (cancelaciones)
- MRR (Monthly Recurring Revenue)

### Dashboard Técnico

- Uptime del servidor
- Tiempo de respuesta API
- Errores en webhooks
- Sincronizaciones Whop exitosas/fallidas
- Pagos recuperados vs fallidos

---

## 📚 Documentación Adicional

- **BILLING.md** - Documentación completa del sistema de billing
- **SETUP_STRIPE.md** - Guía de configuración de Stripe
- **README.md** - Documentación general del proyecto

---

## 🎯 Próximos Pasos

### Optimizaciones

1. **Analytics Dashboard**
   - Gráficos de conversión
   - Métricas de recuperación de pagos
   - ROI por plan

2. **Notificaciones**
   - Email cuando trial termina
   - Email cuando se alcanza 80% del límite
   - Slack/Discord notifications

3. **Features Avanzados**
   - Exportar reportes PDF
   - Múltiples usuarios por empresa
   - Roles y permisos
   - API pública para integraciones

4. **Escalabilidad**
   - Migrar a PostgreSQL
   - Redis para cache
   - Queue system (BullMQ)
   - Microservicios

---

## ✅ Checklist Final

Antes de vender/lanzar, asegúrate de:

- [ ] Sistema completo probado (Fase 1 + Fase 2)
- [ ] Stripe configurado y funcionando
- [ ] Whop API conectada y sincronizando
- [ ] Límites se aplican correctamente
- [ ] Upgrades y downgrades funcionan
- [ ] Emails se envían correctamente
- [ ] Webhooks se procesan sin errores
- [ ] Frontend responsive en mobile
- [ ] Términos de servicio y política de privacidad
- [ ] Landing page de marketing
- [ ] Documentación para clientes
- [ ] Soporte (email o chat)

---

**¡El sistema está LISTO para vender! 🎉**

**Pricing Sugerido:**
- FREE: Trial 14 días + 50 pagos/mes
- PRO: $49/mes + 500 pagos/mes
- ENTERPRISE: $199/mes + pagos ilimitados

**Valor para el cliente:**
- Recuperan pagos fallidos automáticamente
- Aumentan ingresos sin esfuerzo extra
- Ahorran tiempo (sincronización automática)
- Soporte y herramientas profesionales

---

**Creado por:** Marc P  
**Versión:** 2.0.0 (Fase 1 + Fase 2 completadas)  
**Fecha:** Octubre 2025
