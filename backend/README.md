# Whop Retry - Backend

Backend del MVP para recuperar pagos fallidos de Whop.

## 🚀 Instalación

```bash
npm install
```

## ⚙️ Configuración

Copia `.env.example` a `.env` y ajusta las variables:

```env
PORT=3000
DATABASE_URL=./data.db
SENDGRID_API_KEY=         # Opcional, si no existe simula emails
FROM_EMAIL=no-reply@local.dev
RETRY_INTERVALS=60,300,900  # Segundos para reintentos (1min, 5min, 15min)
BASE_URL=http://localhost:3000
```

## 🏃 Ejecutar

```bash
# Modo desarrollo (con auto-reload)
npm run dev

# Modo producción
npm start
```

## 📝 Endpoints

### Webhook
```bash
POST /webhook/whop
# Recibe notificación de pago fallido desde Whop
```

### API Admin
```bash
GET /api/payments?status=pending
# Lista todos los pagos, filtro opcional por status

POST /api/payments/:id/retry
# Fuerza reintento manual de un pago
```

### Página pública
```bash
GET /retry/:token
# Página HTML para que el cliente reintente el pago
```

### Utilidades
```bash
POST /seed-test-payment
# Crea un pago de prueba
```

## 🧪 Probar

### Crear pago de prueba
```bash
curl -X POST http://localhost:3000/seed-test-payment
```

### Simular webhook de Whop
```bash
curl -X POST http://localhost:3000/webhook/whop -H "Content-Type: application/json" -d "{\"event\":\"payment_failed\",\"data\":{\"id\":\"pay_123\",\"email\":\"test@ejemplo.com\",\"product\":\"Curso X\",\"amount\":29.99}}"
```

### Seed múltiples pagos
```bash
npm run seed
```

## 📊 Base de datos

SQLite local en `./data.db`

Tabla `payments`:
- id, email, product, amount
- status (pending, recovered, failed-permanent)
- retries (0-3)
- token, retry_link
- last_attempt, next_attempt, created_at

## 🔄 Lógica de reintentos

1. **Automático**: Scheduler cada 30s busca pagos pendientes listos para reintento
2. **Manual**: Endpoint `/api/payments/:id/retry` o botón en página pública
3. **Intervalos**: Configurables en `RETRY_INTERVALS` (por defecto 60s, 300s, 900s)
4. **Simulación**: 30% probabilidad de éxito en cada intento
5. **Máximo**: 3 intentos antes de marcar como `failed-permanent`

## 📧 Emails

Si `SENDGRID_API_KEY` está configurado, envía emails reales.
Si no, loguea los emails en consola (modo desarrollo).

Emails enviados:
- Pago fallido inicial (con retry link)
- Reintento fallido (con contador)
- Pago recuperado (confirmación)
- Fallo permanente (después de 3 intentos)

## 🎯 Estados de pago

- `pending`: Esperando reintento
- `recovered`: Pago exitoso
- `failed-permanent`: Falló después de 3 intentos
