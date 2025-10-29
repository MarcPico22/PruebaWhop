# 🔧 Configuración de Stripe Billing - Guía Paso a Paso

## ⚠️ IMPORTANTE
Esta guía te ayudará a configurar Stripe Billing para empezar a cobrar suscripciones.
Sigue cada paso en orden.

---

## 📝 PASO 1: Crear Productos en Stripe Dashboard

### 1.1 Acceder a Stripe Dashboard
1. Ve a https://dashboard.stripe.com/
2. Inicia sesión con tu cuenta de Stripe
3. **IMPORTANTE**: Asegúrate de estar en modo **TEST** para hacer pruebas (ver toggle arriba a la derecha)

### 1.2 Crear Producto PRO ($49/mes)

1. En el menú lateral, ve a **Products** → **Add product**
2. Llena los datos:
   ```
   Name: Whop Retry PRO
   Description: Plan profesional con 500 pagos/mes y características avanzadas
   
   Pricing:
   ☑ Recurring
   Price: $49.00
   Billing period: Monthly
   Currency: USD
   
   Payment type: Subscription
   ```
3. Click en **Add product**
4. **📋 COPIAR**: En la página del producto, verás un **Price ID** que empieza con `price_...`
   - Ejemplo: `price_1QABCDef12345678`
   - **Cópialo** - lo necesitarás para el .env

### 1.3 Crear Producto ENTERPRISE ($199/mes)

1. En Products, click en **Add product** nuevamente
2. Llena los datos:
   ```
   Name: Whop Retry ENTERPRISE
   Description: Plan enterprise con pagos ilimitados y soporte prioritario
   
   Pricing:
   ☑ Recurring
   Price: $199.00
   Billing period: Monthly
   Currency: USD
   
   Payment type: Subscription
   ```
3. Click en **Add product**
4. **📋 COPIAR**: Copia el **Price ID** de este producto también
   - Ejemplo: `price_2QXYZabc87654321`

---

## 🔔 PASO 2: Configurar Webhook Endpoint

### 2.1 Crear el Webhook

1. En el menú lateral, ve a **Developers** → **Webhooks**
2. Click en **Add endpoint**
3. Llena los datos:
   ```
   Endpoint URL: http://localhost:3000/webhook/stripe-billing
   
   (⚠️ NOTA: Si vas a usar esto en producción, cambia a tu dominio real:
    https://tudominio.com/webhook/stripe-billing)
   
   Description: Whop Retry Billing Webhook
   ```

### 2.2 Seleccionar Eventos

4. En "Events to send", busca y selecciona los siguientes eventos:

   ✅ **checkout.session.completed**
   ✅ **customer.subscription.created**
   ✅ **customer.subscription.updated**
   ✅ **customer.subscription.deleted**
   ✅ **invoice.payment_failed**
   ✅ **invoice.payment_succeeded**

5. Click en **Add endpoint**

### 2.3 Obtener el Webhook Secret

6. Después de crear el endpoint, verás una página con los detalles
7. Click en **Reveal** al lado de "Signing secret"
8. **📋 COPIAR**: El secret empieza con `whsec_...`
   - Ejemplo: `whsec_ABCDef123456789xyz`

---

## 🔑 PASO 3: Actualizar Variables de Entorno

### 3.1 Crear archivo .env (si no existe)

1. En la carpeta `backend/`, copia `.env.example` a `.env`:
   ```powershell
   cd C:\Users\marcp\Desktop\Prueba\backend
   Copy-Item .env.example .env
   ```

### 3.2 Editar .env

2. Abre `backend/.env` y actualiza estas variables:

```bash
# ====================
# SISTEMA DE BILLING Y SUSCRIPCIONES
# ====================

# Stripe Secret Key (obtenla de Dashboard → Developers → API keys)
# En TEST mode: empieza con sk_test_...
# En LIVE mode: empieza con sk_live_...
STRIPE_SECRET_KEY=sk_test_TU_STRIPE_SECRET_KEY_AQUI

# Webhook Secret (el que copiaste en Paso 2.3)
STRIPE_BILLING_WEBHOOK_SECRET=whsec_TU_WEBHOOK_SECRET_AQUI

# Price IDs (los que copiaste en Paso 1.2 y 1.3)
STRIPE_PRICE_ID_PRO=price_TU_PRO_PRICE_ID_AQUI
STRIPE_PRICE_ID_ENTERPRISE=price_TU_ENTERPRISE_PRICE_ID_AQUI
```

### 3.3 Obtener Stripe Secret Key (si no la tienes)

1. Ve a **Developers** → **API keys** en Stripe Dashboard
2. Copia la **Secret key** (empieza con `sk_test_...` en modo test)
3. Pégala en `STRIPE_SECRET_KEY` en tu .env

---

## ✅ PASO 4: Verificar Configuración

### 4.1 Checklist Final

Verifica que tu archivo `.env` tenga todas estas variables:

```bash
✅ STRIPE_SECRET_KEY=sk_test_...
✅ STRIPE_BILLING_WEBHOOK_SECRET=whsec_...
✅ STRIPE_PRICE_ID_PRO=price_...
✅ STRIPE_PRICE_ID_ENTERPRISE=price_...
```

### 4.2 Reiniciar Backend

```powershell
# Detener el backend (Ctrl+C si está corriendo)
# Iniciar nuevamente
cd C:\Users\marcp\Desktop\Prueba\backend
npm start
```

---

## 🧪 PASO 5: Probar con Stripe CLI (Opcional pero Recomendado)

### 5.1 Instalar Stripe CLI

1. Descarga desde: https://stripe.com/docs/stripe-cli
2. Instala y abre una nueva terminal PowerShell

### 5.2 Login

```powershell
stripe login
```

### 5.3 Escuchar Webhooks Localmente

```powershell
stripe listen --forward-to localhost:3000/webhook/stripe-billing
```

Esto te dará un **webhook signing secret** temporal que puedes usar para testing local.

### 5.4 Trigger Test Webhook

En otra terminal:

```powershell
stripe trigger checkout.session.completed
```

Deberías ver logs en tu backend confirmando que recibió el webhook.

---

## 🚨 Troubleshooting

### Error: "Invalid API Key"
- Verifica que copiaste la Secret Key correctamente
- Asegúrate de estar usando la key del modo correcto (test/live)

### Webhook no se recibe
- Verifica que el backend esté corriendo en el puerto 3000
- Si usas localhost, usa Stripe CLI para forward
- Verifica que copiaste el webhook secret correctamente

### Price IDs no funcionan
- Verifica que los Price IDs empiecen con `price_`
- Verifica que sean del mismo modo (test/live) que tu Secret Key

---

## 📊 Siguiente Paso

Una vez completada esta configuración, puedes:

1. ✅ Probar el flujo completo de suscripciones
2. ✅ Ver el README.md para testing manual
3. ✅ Continuar con Fase 2: Integración Whop API

---

**¿Necesitas ayuda?** Revisa los logs del backend para ver mensajes de error específicos.
