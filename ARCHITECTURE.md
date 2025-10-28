# 🎨 ARQUITECTURA Y FLUJO - Whop Retry MVP

## 📐 Arquitectura General

```
┌─────────────────────────────────────────────────────────────┐
│                        WHOP RETRY MVP                        │
└─────────────────────────────────────────────────────────────┘

┌────────────┐         ┌──────────────┐         ┌─────────────┐
│            │         │              │         │             │
│   WHOP     │────────▶│   BACKEND    │◀────────│  DASHBOARD  │
│  (Webhook) │         │  (Node.js)   │         │   (React)   │
│            │         │              │         │             │
└────────────┘         └──────┬───────┘         └─────────────┘
                              │
                              │
                       ┌──────▼──────┐
                       │             │
                       │   SQLite    │
                       │  (data.db)  │
                       │             │
                       └──────┬──────┘
                              │
                              │
                       ┌──────▼──────┐
                       │             │
                       │  SendGrid   │
                       │   (Email)   │
                       │             │
                       └─────────────┘
```

---

## 🔄 Flujo de Datos Completo

### 1️⃣ Recepción de Pago Fallido

```
WHOP
  │
  │ POST /webhook/whop
  │ {
  │   "event": "payment_failed",
  │   "data": {
  │     "id": "pay_123",
  │     "email": "user@example.com",
  │     "product": "Curso X",
  │     "amount": 99.99
  │   }
  │ }
  ▼
BACKEND (routes.js)
  │
  ├─ Validar evento
  ├─ Generar token único (UUID)
  ├─ Crear retry_link
  │
  ├─ Guardar en DB
  │   └─ status: 'pending'
  │   └─ retries: 0
  │   └─ next_attempt: now + 60s
  │
  ├─ Enviar email inicial
  │   └─ "Tu pago falló - reintenta aquí"
  │   └─ Incluye retry_link
  │
  └─ Respuesta 200 OK
```

### 2️⃣ Reintentos Automáticos

```
SCHEDULER (retry-logic.js)
  │
  │ ⏰ Cada 30 segundos
  │
  ├─ Query DB: pagos con next_attempt <= now
  │
  ├─ Para cada pago pendiente:
  │   │
  │   ├─ attemptCharge() → Simula cobro (30% éxito)
  │   │
  │   ├─ Si ÉXITO:
  │   │   ├─ Update status = 'recovered'
  │   │   ├─ Enviar email: "✅ Pago completado"
  │   │   └─ FIN
  │   │
  │   └─ Si FALLO:
  │       │
  │       ├─ retries++
  │       │
  │       ├─ Si retries < 3:
  │       │   ├─ Calcular next_attempt
  │       │   │   └─ Intervalo: [60s, 300s, 900s]
  │       │   ├─ Update DB
  │       │   └─ Enviar email: "Reintento X/3 falló"
  │       │
  │       └─ Si retries >= 3:
  │           ├─ Update status = 'failed-permanent'
  │           └─ Enviar email: "❌ Fallo permanente"
```

### 3️⃣ Reintento Manual (Dashboard)

```
USUARIO EN DASHBOARD
  │
  │ Click botón "🔄 Retry"
  │
  ▼
FRONTEND (App.jsx)
  │
  │ POST /api/payments/:id/retry
  │
  ▼
BACKEND (routes.js)
  │
  ├─ Obtener payment desde DB
  │
  ├─ Validar estado (no 'recovered' ni 'failed-permanent')
  │
  ├─ processRetry(payment)
  │   └─ [Mismo flujo que reintento automático]
  │
  └─ Respuesta con resultado
      │
      ▼
FRONTEND
  │
  ├─ Mostrar mensaje de éxito/fallo
  │
  └─ Recargar lista de pagos
```

### 4️⃣ Reintento desde Página Pública

```
CLIENTE
  │
  │ Recibe email con retry_link
  │
  │ Click en link
  │
  ▼
NAVEGADOR
  │
  │ GET /retry/:token
  │
  ▼
BACKEND (routes.js)
  │
  ├─ Buscar payment por token
  │
  ├─ Generar HTML con:
  │   ├─ Producto, monto, email
  │   ├─ Estado actual
  │   ├─ Contador de intentos
  │   └─ Botón "Reintentar pago ahora"
  │
  └─ Respuesta HTML
      │
      ▼
CLIENTE
  │
  │ Ve página y click en botón
  │
  │ JavaScript: POST /api/payments/:id/retry
  │
  └─ [Mismo flujo que reintento manual]
```

---

## 🗂️ Estructura de Base de Datos

### Tabla: `payments`

```sql
CREATE TABLE payments (
  id                TEXT PRIMARY KEY,      -- ID del pago (ej: pay_123)
  email             TEXT NOT NULL,         -- Email del cliente
  product           TEXT NOT NULL,         -- Nombre del producto
  amount            REAL NOT NULL,         -- Monto del pago
  status            TEXT DEFAULT 'pending', -- pending | recovered | failed-permanent
  retries           INTEGER DEFAULT 0,     -- Número de reintentos (0-3)
  token             TEXT UNIQUE NOT NULL,  -- UUID para retry_link
  retry_link        TEXT,                  -- URL pública de reintento
  last_attempt      INTEGER,               -- Timestamp último intento
  next_attempt      INTEGER,               -- Timestamp próximo reintento
  created_at        INTEGER DEFAULT now()  -- Timestamp creación
)
```

### Estados de Pago

| Estado | Descripción | Color |
|--------|-------------|-------|
| `pending` | Esperando reintento | 🟡 Amarillo |
| `recovered` | Pago exitoso | 🟢 Verde |
| `failed-permanent` | Falló después de 3 intentos | 🔴 Rojo |

---

## 📧 Flujo de Emails

```
┌─────────────────────────────────────────────────────────────┐
│                      EMAILS ENVIADOS                         │
└─────────────────────────────────────────────────────────────┘

1. PAGO FALLIDO INICIAL
   ├─ Asunto: "Tu pago para {producto} falló — reintenta aquí"
   ├─ Cuándo: Al recibir webhook
   └─ Contiene: retry_link

2. REINTENTO FALLIDO (enviar en intentos 1, 2, 3 si fallan)
   ├─ Asunto: "Reintento {N} para {producto} — aún sin éxito"
   ├─ Cuándo: Después de cada reintento fallido
   ├─ Contiene: retry_link, contador N/3
   └─ Si N=3 y falla → enviar email #4

3. PAGO RECUPERADO
   ├─ Asunto: "✅ Pago exitoso para {producto}"
   ├─ Cuándo: Después de reintento exitoso
   └─ Contiene: Confirmación de éxito

4. FALLO PERMANENTE
   ├─ Asunto: "No pudimos procesar tu pago para {producto}"
   ├─ Cuándo: Después de 3 intentos fallidos
   └─ Contiene: Instrucción de contactar soporte
```

---

## ⚙️ Componentes del Backend

```
backend/
├─ server.js           → Servidor Express principal
├─ db.js              → SQLite: conexión + queries
├─ routes.js          → Endpoints API y webhooks
├─ mailer.js          → Envío de emails (SendGrid)
├─ retry-logic.js     → Scheduler y lógica de reintentos
└─ seed.js            → Script de datos de prueba
```

### Responsabilidades

| Archivo | Función Principal |
|---------|-------------------|
| `server.js` | Iniciar Express, middleware, scheduler |
| `db.js` | CRUD de pagos, estadísticas |
| `routes.js` | Webhook, API admin, página pública |
| `mailer.js` | Plantillas y envío de emails |
| `retry-logic.js` | Scheduler, simulación de cobros |
| `seed.js` | Generar datos de prueba |

---

## 🎨 Componentes del Frontend

```
frontend/src/
├─ main.jsx           → Entry point React
├─ App.jsx            → Dashboard principal
└─ index.css          → Estilos Tailwind
```

### App.jsx - Funciones Principales

```javascript
fetchPayments()      // GET /api/payments (con filtro)
handleRetry(id)      // POST /api/payments/:id/retry
handleCreateTest()   // POST /seed-test-payment
showMessage()        // Mostrar notificación temporal

useEffect() {
  fetchPayments()    // Al montar componente
  setInterval()      // Auto-refresh cada 10s
}
```

---

## 🔐 Variables de Entorno

```env
# Backend (.env)
PORT=3000                           # Puerto del servidor
DATABASE_URL=./data.db              # Ruta a SQLite
SENDGRID_API_KEY=                   # API key SendGrid (opcional)
FROM_EMAIL=no-reply@local.dev       # Email remitente
RETRY_INTERVALS=60,300,900          # Intervalos en segundos
BASE_URL=http://localhost:3000      # URL base para retry_links
```

**Intervalos de reintento:**
- `60` → 1 minuto (dev)
- `300` → 5 minutos (dev)
- `900` → 15 minutos (dev)

**Para producción:** `3600,21600,86400` (1h, 6h, 24h)

---

## 🧮 Lógica de Reintentos

### Cálculo de `next_attempt`

```javascript
const retryIntervals = [60, 300, 900] // RETRY_INTERVALS
const now = Math.floor(Date.now() / 1000)

// Primer reintento (retries = 0)
next_attempt = now + retryIntervals[0] // +60s

// Segundo reintento (retries = 1)
next_attempt = now + retryIntervals[1] // +300s

// Tercer reintento (retries = 2)
next_attempt = now + retryIntervals[2] // +900s

// Si retries >= 3 → failed-permanent
```

### Scheduler

```javascript
setInterval(() => {
  const duePayments = getPaymentsDueForRetry()
  // SELECT * FROM payments 
  // WHERE status='pending' 
  // AND next_attempt <= NOW 
  // AND retries < 3
  
  for (const payment of duePayments) {
    await processRetry(payment)
  }
}, 30000) // Cada 30 segundos
```

---

## 📊 Dashboard - Secciones

```
┌────────────────────────────────────────────────────────┐
│  💳 Whop Retry                    [+ Crear pago test]  │
├────────────────────────────────────────────────────────┤
│                                                         │
│  ┌───────┬─────────┬──────────┬────────┬─────────────┐ │
│  │ Total │ Pending │ Recov.   │ Failed │ $ Recovered │ │
│  │   10  │    3    │    5     │   2    │   $499.95   │ │
│  └───────┴─────────┴──────────┴────────┴─────────────┘ │
│                                                         │
│  [Todos] [Pendientes] [Recuperados] [Fallidos]         │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │ Email    │ Producto │ $ │ Estado │ Retry │ Acc │   │
│  ├─────────────────────────────────────────────────┤   │
│  │ test@... │ Curso X  │99│ ⏳ Pend│ 1/3  │[Retry]│   │
│  │ user@... │ eBook    │19│ ✅ Rec │ 2/3  │  ✅   │   │
│  │ fail@... │ Memb.    │29│ ❌ Fail│ 3/3  │  ❌   │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  💡 Auto-refresh cada 10 segundos                      │
└────────────────────────────────────────────────────────┘
```

---

## 🔄 Ciclo de Vida de un Pago

```
┌─────────────┐
│   Webhook   │
│   received  │
└──────┬──────┘
       │
       ▼
┌─────────────┐     ┌──────────────┐
│   pending   │────▶│   retries++  │
│  (retries=0)│     │ next_attempt │
└──────┬──────┘     └──────┬───────┘
       │                   │
       │ ◀─────────────────┘
       │
       ├─────────────┐
       │             │
       ▼             ▼
┌─────────────┐  ┌──────────────────┐
│  recovered  │  │ failed-permanent │
│             │  │   (retries=3)    │
└─────────────┘  └──────────────────┘
```

---

## 🚀 Endpoints API - Resumen

| Método | Ruta | Descripción | Auth |
|--------|------|-------------|------|
| POST | `/webhook/whop` | Recibe pago fallido de Whop | ❌ |
| GET | `/api/payments` | Lista todos los pagos | ❌ |
| GET | `/api/payments?status=X` | Lista por estado | ❌ |
| POST | `/api/payments/:id/retry` | Fuerza reintento | ❌ |
| GET | `/retry/:token` | Página pública HTML | ❌ |
| POST | `/seed-test-payment` | Crea pago de prueba | ❌ |
| GET | `/health` | Health check | ❌ |

> 💡 Auth = ❌ significa sin autenticación (MVP)

---

## ⏱️ Timing y Performance

### Configuración Dev (rápida)
- Scheduler: cada **30 segundos**
- Intervalos: **60s, 300s, 900s** (1min, 5min, 15min)
- Auto-refresh frontend: **10 segundos**

### Configuración Prod (recomendada)
- Scheduler: cada **60 segundos**
- Intervalos: **3600s, 21600s, 86400s** (1h, 6h, 24h)
- Auto-refresh frontend: **30 segundos**

---

## 📱 Responsive Design

El dashboard es responsive y se adapta a:
- 🖥️ Desktop (>1024px)
- 💻 Laptop (768px - 1024px)
- 📱 Mobile (< 768px)

Tailwind CSS se encarga automáticamente con clases como:
```jsx
<div className="grid grid-cols-1 md:grid-cols-5 gap-4">
```

---

Esta documentación técnica describe toda la arquitectura del MVP.
Para uso rápido, consulta `QUICKSTART.md` o `TESTING.md`.
