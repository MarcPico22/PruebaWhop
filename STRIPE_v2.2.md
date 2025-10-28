# 💳 Integración Stripe - Guía Completa

## 📋 Índice
1. [Resumen](#resumen)
2. [Configuración de Stripe](#configuración-de-stripe)
3. [Arquitectura](#arquitectura)
4. [Funcionalidades Implementadas](#funcionalidades-implementadas)
5. [Webhooks](#webhooks)
6. [Testing](#testing)
7. [Despliegue a Producción](#despliegue-a-producción)

---

## 🎯 Resumen

**Versión:** v2.2  
**Fecha:** Diciembre 2024  
**Estado:** ✅ Implementado

### ¿Qué es Stripe?
Stripe es un procesador de pagos líder mundial que permite aceptar pagos con tarjeta de forma segura. Esta integración reemplaza el sistema de "simulación" de pagos por pagos reales.

### ¿Por qué Stripe?
- ✅ **Seguro**: PCI DSS Level 1 compliant
- ✅ **Fácil**: Checkout pre-construido
- ✅ **Global**: Acepta tarjetas internacionales
- ✅ **Multi-tenant**: Aislamiento por empresa

---

## ⚙️ Configuración de Stripe

### 1. Crear cuenta de Stripe

1. Ir a [stripe.com](https://stripe.com)
2. Registrarse (email + contraseña)
3. Activar cuenta de prueba (Test Mode)

### 2. Obtener claves API

1. Ir al Dashboard → **Developers** → **API Keys**
2. Copiar:
   - **Publishable key**: `pk_test_...` (no necesaria ahora, solo para frontend directo)
   - **Secret key**: `sk_test_...` ⚠️ SECRETA

### 3. Configurar Webhooks

1. Ir a **Developers** → **Webhooks**
2. Click en **Add endpoint**
3. URL del endpoint: `https://tu-dominio.com/webhook/stripe`
4. Eventos a escuchar:
   - `checkout.session.completed`
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
5. Copiar el **Signing secret**: `whsec_...`

### 4. Configurar variables de entorno

Editar `backend/.env`:

```env
# Stripe Configuration (TEST MODE)
STRIPE_SECRET_KEY=sk_test_tu_clave_secreta_real
STRIPE_WEBHOOK_SECRET=whsec_tu_webhook_secret_real
```

⚠️ **IMPORTANTE**: Nunca commitear estas claves al repositorio.

---

## 🏗️ Arquitectura

### Flujo de Pago

```
1. Usuario hace clic en "💳 Stripe" en Dashboard
   ↓
2. Frontend llama a POST /api/stripe/create-checkout-session
   ↓
3. Backend crea Stripe Checkout Session
   ↓
4. Usuario es redirigido a Stripe (URL segura)
   ↓
5. Usuario ingresa datos de tarjeta en Stripe
   ↓
6. Stripe procesa pago
   ↓
7. Stripe envía webhook a /webhook/stripe
   ↓
8. Backend actualiza estado del pago a "recovered"
   ↓
9. Usuario es redirigido a success_url
```

### Archivos Modificados

#### Backend
```
backend/
├── stripe-service.js       (NUEVO) - Lógica de Stripe
├── routes.js               (MODIFICADO) - Rutas Stripe
├── .env                    (MODIFICADO) - Claves API
└── package.json            (MODIFICADO) - Dependencia stripe
```

#### Frontend
```
frontend/src/
├── StripePayment.jsx       (NUEVO) - Modal de pago
└── Dashboard.jsx           (MODIFICADO) - Botón Stripe
```

---

## 🚀 Funcionalidades Implementadas

### 1. Stripe Checkout

**Endpoint**: `POST /api/stripe/create-checkout-session`  
**Autenticación**: JWT requerido  
**Body**:
```json
{
  "paymentId": "pay_123"
}
```

**Response**:
```json
{
  "success": true,
  "sessionId": "cs_test_...",
  "url": "https://checkout.stripe.com/c/pay/cs_test_..."
}
```

**Funciones principales** (`stripe-service.js`):

```javascript
// Crear sesión de Checkout
createCheckoutSession(payment, tenantId)

// Metadata incluida:
{
  payment_id: payment.id,      // ID del pago en nuestra DB
  tenant_id: tenantId,         // Empresa del usuario
  retry_token: payment.token   // Token de retry
}
```

### 2. Webhook de Stripe

**Endpoint**: `POST /webhook/stripe`  
**Headers**: `stripe-signature` (verificación de firma)

**Eventos manejados**:

| Evento | Descripción | Acción |
|--------|-------------|--------|
| `checkout.session.completed` | Pago completado exitosamente | Marca pago como "recovered" |
| `payment_intent.succeeded` | Payment Intent exitoso | Log confirmación |
| `payment_intent.payment_failed` | Pago falló | Log error |

**Función de verificación**:
```javascript
verifyWebhookSignature(payload, signature)
// - Verifica que el webhook proviene realmente de Stripe
// - Previene ataques de spoofing
```

### 3. Modal de Pago (Frontend)

**Componente**: `StripePayment.jsx`

**Props**:
- `payment` - Objeto con datos del pago
- `onClose` - Callback para cerrar modal
- `onSuccess` - Callback después de pago exitoso

**Funcionalidades**:
- ✅ Muestra detalles del pago (producto, monto, email)
- ✅ Botón para iniciar Checkout
- ✅ Loading state durante creación de sesión
- ✅ Manejo de errores
- ✅ Dark mode support

### 4. Integración en Dashboard

**Botón Stripe agregado** en cada fila de pago pendiente:

```jsx
<button
  onClick={() => setSelectedPayment(payment)}
  className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
>
  💳 Stripe
</button>
```

**Estados gestionados**:
- `selectedPayment` - Pago seleccionado para modal
- Modal se renderiza condicionalmente
- Auto-refresh después de pago exitoso

---

## 🔔 Webhooks

### Configuración Local (Testing)

Para probar webhooks localmente, usa **Stripe CLI**:

#### 1. Instalar Stripe CLI

**Windows**:
```powershell
scoop bucket add stripe https://github.com/stripe/scoop-stripe-cli.git
scoop install stripe
```

**Mac**:
```bash
brew install stripe/stripe-cli/stripe
```

**Linux**:
```bash
curl -s https://packages.stripe.dev/api/security/keypair/stripe-cli-gpg/public | gpg --dearmor | sudo tee /usr/share/keyrings/stripe.gpg
echo "deb [signed-by=/usr/share/keyrings/stripe.gpg] https://packages.stripe.dev/stripe-cli-debian-local stable main" | sudo tee -a /etc/apt/sources.list.d/stripe.list
sudo apt update
sudo apt install stripe
```

#### 2. Iniciar sesión

```bash
stripe login
# Se abrirá navegador para autenticar
```

#### 3. Escuchar webhooks

```bash
stripe listen --forward-to localhost:3000/webhook/stripe
```

Output esperado:
```
Ready! Your webhook signing secret is whsec_test_abc123...
```

Copiar el `whsec_...` al `.env`:
```env
STRIPE_WEBHOOK_SECRET=whsec_test_abc123...
```

#### 4. Probar webhook

En otra terminal:
```bash
stripe trigger checkout.session.completed
```

### Configuración en Producción

1. En Stripe Dashboard → Webhooks
2. Agregar endpoint: `https://tu-dominio.com/webhook/stripe`
3. Seleccionar eventos
4. Copiar webhook secret al .env de producción

---

## 🧪 Testing

### Tarjetas de Prueba

Stripe provee tarjetas de prueba para diferentes escenarios:

| Número | Tipo | Resultado |
|--------|------|-----------|
| `4242 4242 4242 4242` | Visa | ✅ Éxito |
| `4000 0000 0000 0002` | Visa | ❌ Fallo (tarjeta rechazada) |
| `4000 0025 0000 3155` | Visa | ⚠️ Requiere autenticación 3D Secure |
| `4000 0000 0000 9995` | Visa | ❌ Fondos insuficientes |

**Otros datos de prueba**:
- **Expiración**: Cualquier fecha futura (ej: 12/25)
- **CVC**: Cualquier 3 dígitos (ej: 123)
- **ZIP**: Cualquier código (ej: 10001)

### Flujo de Testing Completo

1. **Crear pago de prueba** (Dashboard):
   ```
   Click en "Crear pago de prueba"
   ```

2. **Abrir modal de Stripe**:
   ```
   Click en "💳 Stripe" en la fila del pago
   ```

3. **Procesar pago**:
   - Click en "Pagar con Stripe"
   - Usar tarjeta de prueba
   - Completar Checkout

4. **Verificar webhook**:
   - Revisar terminal con `stripe listen`
   - Verificar logs del backend
   - Confirmar estado actualizado en Dashboard

### Comandos útiles de Stripe CLI

```bash
# Ver todos los eventos
stripe events list

# Ver detalles de un evento
stripe events retrieve evt_123

# Simular eventos
stripe trigger payment_intent.succeeded
stripe trigger payment_intent.payment_failed

# Ver logs
stripe logs tail
```

---

## 🌐 Despliegue a Producción

### Checklist Pre-Producción

- [ ] Cambiar a claves de producción en `.env`
- [ ] Configurar webhook de producción en Stripe
- [ ] Habilitar HTTPS (requerido por Stripe)
- [ ] Verificar dominio en Stripe
- [ ] Configurar URLs de success/cancel
- [ ] Probar con tarjeta real (pequeño monto)

### 1. Obtener Claves de Producción

En Stripe Dashboard:
1. **Desactivar** "Test mode" (toggle arriba a la derecha)
2. Ir a **Developers** → **API Keys**
3. Copiar claves **LIVE**:
   - `pk_live_...`
   - `sk_live_...`

### 2. Configurar .env de Producción

```env
# Stripe PRODUCTION
STRIPE_SECRET_KEY=sk_live_tu_clave_real
STRIPE_WEBHOOK_SECRET=whsec_tu_webhook_real
BASE_URL=https://tu-dominio.com
```

### 3. Configurar Webhook de Producción

1. Stripe Dashboard (modo live)
2. **Developers** → **Webhooks** → **Add endpoint**
3. URL: `https://tu-dominio.com/webhook/stripe`
4. Eventos:
   - `checkout.session.completed`
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
5. Copiar webhook secret

### 4. Seguridad

**Variables secretas** (NUNCA exponer):
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`

**Verificaciones implementadas**:
- ✅ Firma de webhook verificada
- ✅ Metadata con tenant_id (multi-tenant)
- ✅ HTTPS obligatorio en producción
- ✅ Autenticación JWT en endpoints

### 5. Monitoreo

En Stripe Dashboard puedes monitorear:
- **Payments** → Ver todos los pagos
- **Customers** → Clientes que pagaron
- **Events & Webhooks** → Logs de webhooks
- **Radar** → Detección de fraude (automático)

---

## 🔍 Troubleshooting

### Problema: Webhook no recibe eventos

**Causa**: URL incorrecta o secret mal configurado

**Solución**:
```bash
# Verificar que Stripe CLI esté escuchando
stripe listen --forward-to localhost:3000/webhook/stripe

# Probar manualmente
curl -X POST http://localhost:3000/webhook/stripe \
  -H "Content-Type: application/json" \
  -d '{"type":"test"}'
```

### Problema: Error "No such checkout session"

**Causa**: Claves de test mezcladas con producción

**Solución**:
- Verificar que `.env` tenga solo claves de test (`sk_test_...`)
- Reiniciar backend después de cambiar `.env`

### Problema: "Signature verification failed"

**Causa**: `STRIPE_WEBHOOK_SECRET` incorrecto

**Solución**:
```bash
# Regenerar secret con Stripe CLI
stripe listen --print-secret

# Copiar output al .env
STRIPE_WEBHOOK_SECRET=whsec_nuevo_secret
```

### Problema: Modal no redirige a Stripe

**Causa**: `STRIPE_SECRET_KEY` no configurada

**Solución**:
```bash
# Verificar .env
cat backend/.env | grep STRIPE

# Debe mostrar:
# STRIPE_SECRET_KEY=sk_test_...
```

### Logs útiles

Backend mostrará:
```
✅ Stripe Checkout creado para pago pay_123
📥 Webhook Stripe recibido: checkout.session.completed
✅ Pago pay_123 recuperado vía Stripe
```

---

## 📚 Recursos

- [Stripe Docs](https://stripe.com/docs)
- [Stripe API Reference](https://stripe.com/docs/api)
- [Checkout Sessions](https://stripe.com/docs/payments/checkout)
- [Webhooks Guide](https://stripe.com/docs/webhooks)
- [Testing Guide](https://stripe.com/docs/testing)

---

## 🎉 Siguiente Paso

Con Stripe implementado, el sistema ahora puede:
- ✅ Procesar pagos reales
- ✅ Multi-tenant con aislamiento
- ✅ Webhooks seguros con verificación
- ✅ UI profesional con modal

**Próximas mejoras recomendadas**:
1. **Stripe Elements** - Formulario de tarjeta custom
2. **Subscripciones** - Pagos recurrentes
3. **Customer Portal** - Autoservicio de clientes
4. **Informes** - Dashboard de analytics

---

*Documentación generada por GitHub Copilot*
