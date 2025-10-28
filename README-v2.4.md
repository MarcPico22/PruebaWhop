# 💰 Sistema de Recuperación de Pagos Fallidos - v2.4 Multi-Tenant

Sistema SaaS para recuperar pagos fallidos con **integración multi-tenant**: cada empresa usa sus propias API keys de Stripe y SendGrid.

---

## 🆕 Novedades v2.4 - Multi-Tenant API Keys

### ✅ ¿Qué cambió?

**ANTES (v2.3):**
- Una sola cuenta de Stripe compartida
- Un solo SendGrid para todos
- Todos los pagos iban a una cuenta central

**AHORA (v2.4):**
- ✅ **Cada empresa configura sus propias API keys** (Stripe + SendGrid)
- ✅ **Los pagos van directo a la cuenta de cada empresa** (compliance con Stripe)
- ✅ **Emails enviados desde el dominio de cada empresa**
- ✅ **Keys encriptadas** en la base de datos (AES-256-CBC)
- ✅ **Interfaz fácil** para empresas sin conocimientos técnicos

### 🔐 Seguridad

- **Encriptación AES-256-CBC** con IV aleatorio
- Keys almacenadas encriptadas en la base de datos
- Masking en la UI: `sk_test_•••••••456`
- Validación de formatos antes de guardar

---

## 🎯 ¿Para quién es esto?

### Modelo de negocio:
Vendes este sistema a **empresas** que tienen:
- Clientes que pagan con Stripe
- Problemas con pagos fallidos (tarjetas rechazadas, fondos insuficientes, etc.)
- Necesidad de recuperar esos pagos automáticamente

### Flujo de dinero:
```
Cliente final
    ↓ (paga con tarjeta)
Stripe de LA EMPRESA
    ↓ (2-3 días)
Cuenta bancaria de LA EMPRESA
```

**TÚ** cobras una suscripción mensual/anual por usar el software.  
**LA EMPRESA** recibe los pagos recuperados directamente.

---

## 📦 Características

### ✅ v2.4 - Multi-Tenant API Keys (ACTUAL)
- [x] Cada empresa configura sus propias claves API
- [x] Encriptación AES-256 para todas las keys
- [x] UI de configuración simple (Settings → Integraciones)
- [x] Validación de formatos (Stripe: sk_/pk_/whsec_, SendGrid: SG.)
- [x] Masking de keys en la interfaz
- [x] Fallback a DEMO keys para testing

### ✅ v2.3 - Sistema de Notificaciones
- [x] Emails personalizados (pago fallido, reintento fallido, pago recuperado)
- [x] Configuración de notificaciones por tenant
- [x] Resumen diario de actividad
- [x] Alertas de umbral (ej: 5 pagos fallidos en 1 hora)

### ✅ v2.2 - Integración con Stripe Real
- [x] Webhook de Stripe funcional
- [x] Verificación de firmas
- [x] Multi-tenancy: cada tenant tiene sus propias keys

### ✅ v2.1 - Dashboard Mejorado + Configuración
- [x] UI moderna con animaciones
- [x] Configuración personalizada por tenant (intervalos, max reintentos)
- [x] Visualización en tiempo real
- [x] Notificaciones toast

### ✅ v2.0 - Autenticación Multi-Tenant
- [x] Sistema de registro/login
- [x] JWT authentication
- [x] Aislamiento de datos por tenant
- [x] Dashboard personalizado por usuario

### ✅ v1.0 - Base
- [x] Lógica de reintentos automáticos
- [x] Scheduler (ejecuta cada 30s)
- [x] Generación de links de reintento únicos
- [x] Simulación de pagos (30% éxito)

---

## 🚀 Instalación Rápida

### 1. Clonar y configurar backend

```bash
cd backend
npm install
cp .env.example .env
```

### 2. Editar `.env`

```bash
# REQUERIDO: Secret para encriptar API keys
ENCRYPTION_SECRET=genera_uno_con_crypto_randomBytes_32_hex

# REQUERIDO: Secret para JWT
JWT_SECRET=tu_secret_jwt_super_seguro

# OPCIONAL: Keys de demo para testing
DEMO_STRIPE_SECRET_KEY=sk_test_...
DEMO_SENDGRID_API_KEY=SG...
```

**Generar ENCRYPTION_SECRET:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 3. Iniciar backend

```bash
npm run dev
```

Backend corriendo en `http://localhost:3000`

### 4. Configurar frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend corriendo en `http://localhost:5173`

---

## 📘 Guía para Empresas (No Técnicos)

Si eres una **empresa que compró este sistema**, lee esta guía:  
👉 **[SETUP-EMPRESAS.md](./SETUP-EMPRESAS.md)**

Explica paso a paso:
- ✅ Cómo crear cuenta de Stripe
- ✅ Dónde encontrar las API keys
- ✅ Cómo configurar SendGrid
- ✅ Cómo verificar emails
- ✅ Cómo pegar las keys en el sistema
- ✅ Cómo probar que funciona

---

## 🏗️ Arquitectura Multi-Tenant

### Flujo de configuración

```
Empresa se registra
    ↓
Ve a Settings → Integraciones
    ↓
Pega sus Stripe keys (sk_test_..., pk_test_..., whsec_...)
    ↓
Sistema valida formato
    ↓
Sistema encripta con AES-256
    ↓
Guarda en DB (tenant_integrations)
    ↓
¡Listo! Ahora la empresa recibe pagos en su cuenta
```

### Flujo de pago

```
Cliente paga con Stripe (cuenta de LA EMPRESA)
    ↓
Stripe webhook envía evento
    ↓
Sistema identifica tenant_id del webhook
    ↓
Usa las keys de ESE tenant para procesar
    ↓
Envía email con SendGrid de ESE tenant
    ↓
Registra evento en DB con tenant_id
```

### Base de datos

```sql
-- Tabla de integraciones (NUEVA)
CREATE TABLE tenant_integrations (
  tenant_id TEXT PRIMARY KEY,
  stripe_secret_key TEXT,          -- Encriptado
  stripe_publishable_key TEXT,     -- Encriptado
  stripe_webhook_secret TEXT,      -- Encriptado
  sendgrid_api_key TEXT,           -- Encriptado
  from_email TEXT,
  is_stripe_connected INTEGER DEFAULT 0,
  is_sendgrid_connected INTEGER DEFAULT 0,
  updated_at INTEGER
);
```

---

## 🔧 Módulos Clave

### Backend

#### `encryption.js` (NUEVO)
```javascript
// Encriptar API keys antes de guardar
const encrypted = encrypt('sk_test_ABC123...');
// -> "iv:encryptedData"

// Desencriptar al usar
const decrypted = decrypt(encrypted);
// -> "sk_test_ABC123..."

// Validar formato
validateStripeKey('sk_test_...', 'secret'); // true/false
validateSendGridKey('SG...'); // true/false

// Enmascarar para UI
maskApiKey('sk_test_ABC123XYZ');
// -> "sk_test_•••••••XYZ"
```

#### `stripe-service.js` (MODIFICADO)
```javascript
// Obtiene instancia de Stripe para un tenant
const stripe = await getStripeInstance(tenantId);

// Crea checkout con la cuenta del tenant
await stripe.checkout.sessions.create({...});

// Verifica webhook con el secret del tenant
verifyWebhookSignature(payload, signature, tenantId);
```

#### `mailer.js` (MODIFICADO)
```javascript
// Envía email usando SendGrid del tenant
await sendEmail(to, subject, text, html, tenantId);

// Auto-configura SendGrid con la key del tenant
// Fallback a DEMO_SENDGRID_API_KEY si no está configurado
```

### Frontend

#### `IntegrationsSettings.jsx` (NUEVO)
- UI para configurar Stripe y SendGrid
- Tabs separados para cada servicio
- Validación en tiempo real
- Muestra keys enmascaradas
- Indicadores de conexión (✅/❌)

#### `Settings.jsx` (MODIFICADO)
- Ahora tiene 2 tabs: "General" e "Integraciones"
- Tab General: configuración de reintentos
- Tab Integraciones: API keys de Stripe y SendGrid

---

## 🧪 Testing

### 1. Crear cuenta de prueba

```bash
POST http://localhost:3000/api/register
{
  "email": "empresa@test.com",
  "password": "123456"
}
```

### 2. Configurar Stripe de prueba

- Ve a Settings → Integraciones → Stripe
- Pega keys de prueba de Stripe:
  - Secret: `sk_test_...` (de tu cuenta de Stripe)
  - Publishable: `pk_test_...`

### 3. Configurar SendGrid de prueba

- Ve a Settings → Integraciones → SendGrid
- Pega:
  - API Key: `SG...` (de tu cuenta de SendGrid)
  - Email remitente: `no-reply@tudominio.com` (verificado en SendGrid)

### 4. Crear pago de prueba

```bash
POST http://localhost:3000/api/test-payment
Headers: Authorization: Bearer <tu_token_jwt>
```

### 5. Verificar

- ✅ Pago creado en dashboard
- ✅ Email recibido (desde tu SendGrid)
- ✅ Reintento automático después del intervalo
- ✅ Pago eventualmente recuperado (30% probabilidad)

---

## 📊 API Endpoints (NUEVOS)

### Integraciones

```bash
# Obtener integraciones (keys enmascaradas)
GET /api/integrations
Headers: Authorization: Bearer <token>
Response: {
  stripe_secret_key: "sk_test_•••••••456",
  stripe_publishable_key: "pk_test_•••••••789",
  stripe_webhook_secret: "whsec_•••••••ABC",
  sendgrid_api_key: "SG.•••••••XYZ",
  from_email: "no-reply@empresa.com",
  is_stripe_connected: true,
  is_sendgrid_connected: true
}

# Guardar integraciones (encripta automáticamente)
POST /api/integrations
Headers: Authorization: Bearer <token>
Body: {
  "stripe_secret_key": "sk_test_...",
  "stripe_publishable_key": "pk_test_...",
  "stripe_webhook_secret": "whsec_...",
  "sendgrid_api_key": "SG...",
  "from_email": "no-reply@empresa.com"
}
Response: { success: true, message: "Integraciones guardadas" }
```

---

## 🔒 Seguridad

### Encriptación de API Keys

```javascript
// Algoritmo: AES-256-CBC
// IV: 16 bytes aleatorios por encriptación
// Key: Derivada de ENCRYPTION_SECRET (32 bytes)
// Formato guardado: "iv:encryptedData" (hex)
```

### Validación de formatos

```javascript
// Stripe Secret Key: ^sk_(test|live)_[a-zA-Z0-9]{24,}$
// Stripe Publishable Key: ^pk_(test|live)_[a-zA-Z0-9]{24,}$
// Stripe Webhook Secret: ^whsec_[a-zA-Z0-9]{32,}$
// SendGrid API Key: ^SG\.[a-zA-Z0-9_-]{22}\.[a-zA-Z0-9_-]{43}$
```

### Masking en UI

```javascript
maskApiKey('sk_test_51ABC123...XYZ456')
// -> "sk_test_•••••••456"
// Muestra primeros 8 chars + últimos 3
```

---

## 🐛 Troubleshooting

### "Error: Encriptación no configurada"

```bash
# Falta ENCRYPTION_SECRET en .env
# Genera uno:
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
# Pégalo en .env:
ENCRYPTION_SECRET=<tu_secret_generado>
```

### "Error: Esta empresa no ha configurado Stripe"

```bash
# El tenant no tiene keys de Stripe
# Solución: Ve a Settings → Integraciones → Stripe y configura
```

### "Error: SendGrid API key inválida"

```bash
# Formato incorrecto
# Debe empezar con "SG."
# Verifica que copiaste la key completa de SendGrid
```

### Emails no se envían

```bash
# 1. Verifica que el email remitente esté verificado en SendGrid
# 2. Ve a SendGrid → Settings → Sender Authentication
# 3. Verifica "Single Sender" o "Domain Authentication"
# 4. Revisa logs del backend (console.log)
```

### Webhook de Stripe no funciona

```bash
# 1. Verifica que el webhook secret esté configurado
# 2. Ve a Stripe → Webhooks y verifica que el endpoint esté activo
# 3. URL debe ser: https://tudominio.com/api/stripe/webhook
# 4. Eventos: payment_intent.succeeded, charge.failed, etc.
```

---

## 📈 Roadmap

### v2.5 - Onboarding Wizard (Próximo)
- [ ] Wizard paso a paso para nuevas empresas
- [ ] Detección automática de configuración faltante
- [ ] Validación en tiempo real de keys
- [ ] Tutorial interactivo

### v2.6 - Analytics
- [ ] Dashboard de métricas por tenant
- [ ] Tasa de recuperación (recovered / failed)
- [ ] Ingresos recuperados
- [ ] Gráficas de tendencias

### v2.7 - Webhooks Personalizados
- [ ] Permite a las empresas recibir webhooks de eventos
- [ ] Notificación cuando un pago se recupera
- [ ] Integración con Zapier/Make

---

## 📄 Licencia

MIT - Puedes usar, modificar y vender este software libremente.

---

## 🆘 Soporte

- **Para empresas (clientes finales):** Lee [SETUP-EMPRESAS.md](./SETUP-EMPRESAS.md)
- **Para desarrolladores:** Abre un issue en GitHub
- **Email:** soporte@tuempresa.com

---

**Hecho con ❤️ para recuperar pagos fallidos** 💰
