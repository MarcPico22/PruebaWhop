# 📝 Changelog - Sistema de Recuperación de Pagos

Todos los cambios notables en este proyecto serán documentados aquí.

---

## [2.4.0] - 2024-12-XX - 🔐 Multi-Tenant API Keys

### 🆕 Añadido

#### Backend
- **`encryption.js`** - Módulo de encriptación AES-256-CBC
  - `encrypt(text)` - Encripta API keys antes de guardar en BD
  - `decrypt(encryptedText)` - Desencripta para uso
  - `maskApiKey(key)` - Enmascara keys para UI (`sk_test_•••••••456`)
  - `validateStripeKey(key, type)` - Valida formato de Stripe keys
  - `validateSendGridKey(key)` - Valida formato de SendGrid keys

- **Tabla `tenant_integrations`** en base de datos
  - Campos: `tenant_id`, `stripe_secret_key`, `stripe_publishable_key`, `stripe_webhook_secret`, `sendgrid_api_key`, `from_email`
  - Flags: `is_stripe_connected`, `is_sendgrid_connected`
  - Timestamps: `created_at`, `updated_at`

- **Funciones en `db.js`**
  - `getTenantIntegrations(tenantId)` - Obtiene integrations de un tenant
  - `updateTenantIntegrations(tenantId, data)` - Actualiza integrations

- **Rutas en `routes.js`**
  - `GET /api/integrations` - Retorna keys enmascaradas del tenant
  - `POST /api/integrations` - Guarda keys encriptadas (con validación)

- **Variables de entorno**
  - `ENCRYPTION_SECRET` (requerido) - Secret para encriptar API keys
  - `DEMO_STRIPE_SECRET_KEY` (opcional) - Fallback para testing
  - `DEMO_SENDGRID_API_KEY` (opcional) - Fallback para testing
  - `DEMO_FROM_EMAIL` (opcional) - Email demo

#### Frontend
- **`IntegrationsSettings.jsx`** - Componente para configurar API keys
  - Tabs separados para Stripe y SendGrid
  - Formularios con validación
  - Muestra keys enmascaradas después de guardar
  - Indicadores de conexión (✅/❌)
  - Links directos a dashboards de Stripe/SendGrid

- **Settings.jsx** ahora tiene 2 tabs:
  - 🔧 General - Configuración de reintentos (ya existía)
  - 🔌 Integraciones - Nuevo componente de API keys

#### Documentación
- **`SETUP-EMPRESAS.md`** - Guía paso a paso para clientes no técnicos
- **`README-v2.4.md`** - Documentación técnica completa
- **`MIGRACION-v2.3-a-v2.4.md`** - Guía de migración desde v2.3
- **`RESUMEN-v2.4.md`** - Resumen ejecutivo de implementación
- **`COMO-USAR.md`** - Guía rápida de inicio
- **`INDICE.md`** - Índice de toda la documentación
- **`generate-secret.js`** - Script para generar ENCRYPTION_SECRET

### 🔄 Modificado

#### Backend
- **`stripe-service.js`**
  - Nueva función `getStripeInstance(tenantId)` - Crea instancia de Stripe con keys del tenant
  - `createCheckoutSession()` ahora usa `getStripeInstance(tenantId)`
  - `verifyWebhookSignature()` ahora soporta webhook secrets por tenant

- **`mailer.js`**
  - Nueva función `getSendGridConfig(tenantId)` - Obtiene config de SendGrid del tenant
  - `sendEmail()` ahora acepta parámetro `tenantId`
  - `sendPaymentFailedEmail()` ahora acepta `tenantId`
  - `sendRetryFailedEmail()` ahora acepta `tenantId`
  - `sendPaymentRecoveredEmail()` ahora acepta `tenantId`
  - `sendPaymentPermanentFailEmail()` ahora acepta `tenantId`

- **`retry-logic.js`**
  - Todas las llamadas a funciones de mailer pasan `payment.tenant_id`

- **`routes.js`**
  - Llamadas a `sendPaymentFailedEmail()` pasan `tenant_id`

- **`.env` y `.env.example`**
  - Reestructurados con secciones claras
  - `ENCRYPTION_SECRET` agregado como requerido
  - Keys globales reemplazadas por `DEMO_*` opcionales
  - Documentación mejorada de cada variable

### 🐛 Corregido
- Problema de compliance con Stripe (ahora cada empresa usa su cuenta)
- Seguridad mejorada (keys encriptadas en BD en lugar de `.env`)

### 🔒 Seguridad
- Todas las API keys ahora se guardan encriptadas (AES-256-CBC)
- IV aleatorio por encriptación (previene ataques de patrón)
- Validación de formatos antes de guardar
- Masking de keys en UI (previene exposición accidental)

### ⚠️ Breaking Changes
- **REQUIERE `ENCRYPTION_SECRET` en `.env`** (generar con `node generate-secret.js`)
- Base de datos necesita nueva tabla `tenant_integrations`
- Keys globales en `.env` ya no se usan (ahora configurar en UI)

---

## [2.3.0] - 2024-12-XX - 📧 Sistema de Notificaciones

### 🆕 Añadido
- **Sistema de notificaciones** para empresas
- **Tabla `notification_settings`** en base de datos
- **Templates de email personalizados**:
  - Pago recuperado
  - Resumen diario de actividad
  - Alertas de umbral
- **Componente `NotificationSettings.jsx`**
- **`notification-service.js`** - Lógica de notificaciones
- Configuración de notificaciones por tenant

### 🔄 Modificado
- `retry-logic.js` ahora envía notificaciones cuando un pago se recupera
- Dashboard muestra estadísticas de notificaciones

---

## [2.2.0] - 2024-11-XX - 💳 Integración Stripe Real

### 🆕 Añadido
- **`stripe-service.js`** - Integración con Stripe API
- Webhook de Stripe (`POST /api/stripe/webhook`)
- Verificación de firmas de webhook
- Soporte para eventos de Stripe (`payment_intent.payment_failed`, `charge.failed`)

### 🔄 Modificado
- Sistema ahora puede procesar pagos reales de Stripe
- `payments` tabla ahora incluye `stripe_payment_intent_id`

### 🐛 Corregido
- Mejora en manejo de errores de webhook

---

## [2.1.0] - 2024-11-XX - 🎨 Dashboard Mejorado

### 🆕 Añadido
- **Configuración personalizada** por tenant
  - Intervalos de reintento configurables
  - Máximo de reintentos configurable
  - Email remitente configurable
- **Modal de Settings** con UI moderna
- **Tabla `config`** en base de datos
- **Endpoints de configuración**:
  - `GET /api/config`
  - `POST /api/config`

### 🔄 Modificado
- Dashboard ahora muestra estadísticas en tiempo real
- UI mejorada con gradientes y animaciones
- Filtros de pagos (Todos, Pendientes, Recuperados, Fallidos)
- Notificaciones toast para feedback de usuario

---

## [2.0.0] - 2024-11-XX - 👥 Multi-Tenant + Autenticación

### 🆕 Añadido
- **Sistema de autenticación**:
  - Registro de usuarios (`POST /api/register`)
  - Login (`POST /api/login`)
  - Autenticación JWT
- **Multi-tenancy**:
  - Tabla `users` con `tenant_id`
  - Aislamiento de datos por tenant
  - Cada usuario solo ve sus propios pagos
- **Componente de login/registro** en frontend
- **Middleware de autenticación** en backend

### 🔄 Modificado
- Todos los endpoints ahora requieren autenticación
- `payments` tabla ahora incluye `tenant_id`
- Dashboard filtrado por tenant automáticamente

### ⚠️ Breaking Changes
- Endpoints ahora requieren header `Authorization: Bearer <token>`
- Base de datos necesita nueva tabla `users`

---

## [1.0.0] - 2024-10-XX - 🚀 Lanzamiento Inicial

### 🆕 Añadido
- **Sistema de reintentos automáticos**
  - Scheduler que ejecuta cada 30 segundos
  - Intervalos configurables (60s, 300s, 900s)
  - Máximo de 3 reintentos
- **Base de datos SQLite**:
  - Tabla `payments`
  - Campos: `id`, `email`, `product`, `amount`, `status`, `retries`, `token`, `retry_link`, `next_attempt`
- **API Backend**:
  - `POST /webhook/payment-failed` - Registra pago fallido
  - `GET /api/payments` - Lista todos los pagos
  - `POST /api/retry/:id` - Reintenta pago manualmente
  - `POST /api/test-payment` - Crea pago de prueba
- **Dashboard Frontend** (React + Vite):
  - Vista de pagos en tabla
  - Indicadores de estado (Pending, Recovered, Failed-permanent)
  - Contador de reintentos
  - Próximo intento
  - Botón de reintento manual
- **Sistema de emails** (SendGrid):
  - Email de pago fallido
  - Email de reintento fallido
  - Email de pago recuperado
  - Email de fallo permanente
- **Script de seed** (`seed.js`) para datos de prueba
- **Links de reintento únicos** (basados en tokens UUID)

### 🎨 UI/UX
- Dashboard responsivo
- Colores diferenciados por estado
- Actualización automática cada 5 segundos
- Botones de acción claros

---

## Formato

Basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.0.0/)

### Tipos de Cambios
- **🆕 Añadido** - Nuevas características
- **🔄 Modificado** - Cambios en funcionalidad existente
- **🐛 Corregido** - Bugs arreglados
- **🗑️ Eliminado** - Características removidas
- **🔒 Seguridad** - Mejoras de seguridad
- **⚠️ Breaking Changes** - Cambios que rompen compatibilidad

---

**Última actualización:** Diciembre 2024  
**Versión actual:** 2.4.0
