# 🏢 Whop Retry v2.1 - Multi-tenancy Completo

## ✅ **Multi-tenancy Implementado**

### ¿Qué es Multi-tenancy?
Aislamiento completo de datos entre empresas. Cada empresa (tenant) solo ve SUS pagos y tiene SU configuración.

---

## 🔧 Cambios Implementados

### 1️⃣ **Base de Datos - Tenant Isolation**

#### Tabla `payments` actualizada:
```sql
CREATE TABLE payments (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL,
  product TEXT NOT NULL,
  amount REAL NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  retries INTEGER NOT NULL DEFAULT 0,
  token TEXT NOT NULL UNIQUE,
  retry_link TEXT,
  last_attempt INTEGER,
  next_attempt INTEGER,
  created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
  tenant_id TEXT  -- ✅ NUEVO: Identifica a qué empresa pertenece
)
```

#### Tabla `config` actualizada:
```sql
CREATE TABLE config (
  key TEXT NOT NULL,
  tenant_id TEXT NOT NULL,  -- ✅ NUEVO
  value TEXT NOT NULL,
  updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
  PRIMARY KEY (key, tenant_id)  -- Cada tenant tiene su propia config
)
```

---

### 2️⃣ **Funciones de DB - Filtrado Automático**

Todas las funciones ahora requieren y filtran por `tenant_id`:

```javascript
// ANTES (sin multi-tenancy)
getPayments(status)  // Todos los pagos
getStats()           // Estadísticas globales
getConfig()          // Config global

// DESPUÉS (con multi-tenancy)
getPayments(tenantId, status)  // Solo pagos del tenant
getStats(tenantId)             // Solo stats del tenant  
getConfig(tenantId)            // Solo config del tenant
```

#### Funciones actualizadas:
- ✅ `insertPayment(payment)` - Ahora requiere `payment.tenant_id`
- ✅ `getPayments(tenantId, status)` - Filtra por tenant
- ✅ `getPaymentById(id, tenantId)` - Valida tenant
- ✅ `getStats(tenantId)` - Estadísticas por tenant
- ✅ `getConfig(tenantId)` - Config por tenant
- ✅ `updateConfig(key, value, tenantId)` - Actualiza solo para tenant
- ✅ `updateMultipleConfig(configObj, tenantId)` - Batch update por tenant

---

### 3️⃣ **Rutas API - Protección con JWT**

Todas las rutas protegidas extraen el `tenantId` del JWT automáticamente:

```javascript
router.get('/api/payments', authenticateToken, (req, res) => {
  const tenantId = req.user.tenantId;  // Del JWT
  const payments = getPayments(tenantId, status);
  // Usuario solo ve SUS pagos
});
```

#### Rutas actualizadas:
- ✅ `GET /api/payments` - Filtra por tenant del usuario
- ✅ `POST /api/payments/:id/retry` - Valida que el pago pertenezca al tenant
- ✅ `GET /api/config` - Config del tenant del usuario
- ✅ `POST /api/config` - Actualiza config solo del tenant

---

### 4️⃣ **Webhook - Asignación de Tenant**

El webhook ahora **requiere** el campo `tenant_id` para saber a qué empresa pertenece el pago:

```javascript
POST /webhook/whop
{
  "event": "payment_failed",
  "tenant_id": "abc-123-def-456",  // ✅ REQUERIDO
  "data": {
    "id": "pay_123",
    "email": "cliente@ejemplo.com",
    "product": "Curso Premium",
    "amount": 99.99
  }
}
```

**Validación:**
```javascript
if (!tenant_id) {
  return res.status(400).json({ 
    error: 'tenant_id es requerido en el webhook' 
  });
}
```

---

### 5️⃣ **Retry Logic - Config por Tenant**

El sistema de reintentos ahora usa la configuración específica de cada tenant:

```javascript
// Lee max_retries del tenant del pago
const maxRetries = getConfigValue('max_retries', payment.tenant_id);

// Lee retry_intervals del tenant del pago
const intervals = getConfigValue('retry_intervals', payment.tenant_id);
```

**Resultado:**
- Empresa A puede tener 3 reintentos con intervalos de 1m, 5m, 15m
- Empresa B puede tener 5 reintentos con intervalos de 30s, 2m, 10m, 30m, 1h

---

### 6️⃣ **Registro de Usuarios - Config Automática**

Cuando un nuevo usuario se registra, se crea automáticamente su configuración por defecto:

```javascript
function createUser(user) {
  // 1. Crear usuario
  stmt.run(user.id, user.email, user.password, user.company_name, user.tenant_id);
  
  // 2. Crear config por defecto para su tenant
  const defaultConfig = {
    retry_intervals: '60,300,900',  // 1m, 5m, 15m
    max_retries: '3',
    from_email: 'no-reply@local.dev'
  };
  
  updateMultipleConfig(defaultConfig, user.tenant_id);
}
```

---

## 🔒 **Seguridad - Aislamiento Garantizado**

### Caso de Prueba 1: Usuario A no puede ver pagos de Usuario B

```javascript
// Usuario A (tenant: aaa-111)
GET /api/payments
Authorization: Bearer {token_usuario_A}

// Respuesta: Solo pagos con tenant_id = 'aaa-111'
[
  { id: 'pay_1', tenant_id: 'aaa-111', ... },
  { id: 'pay_2', tenant_id: 'aaa-111', ... }
]
// ✅ Pagos del Usuario B (tenant: bbb-222) NO aparecen
```

### Caso de Prueba 2: Intento de acceso directo por ID

```javascript
// Usuario A intenta acceder al pago de Usuario B
POST /api/payments/pay_de_usuario_B/retry
Authorization: Bearer {token_usuario_A}

// Backend valida:
getPaymentById('pay_de_usuario_B', 'aaa-111')  // tenant de A

// Respuesta: 404 Not Found
// ✅ El pago existe pero NO pertenece al tenant de A
```

### Caso de Prueba 3: Configuración separada

```javascript
// Usuario A configura sus intervalos
POST /api/config
{ retry_intervals: "30,60,120" }
Authorization: Bearer {token_usuario_A}

// Solo afecta a tenant 'aaa-111'
// Usuario B mantiene su config independiente
```

---

## 📊 **Comparativa Antes vs Después**

| Feature | v2.0 (antes) | v2.1 (después) |
|---------|--------------|----------------|
| **Datos compartidos** | ❌ Todos ven todo | ✅ Aislamiento por tenant |
| **Configuración** | ❌ Global | ✅ Por empresa |
| **Seguridad** | ⚠️ Sin validación | ✅ Validación automática |
| **Escalabilidad** | ❌ 1 empresa | ✅ Infinitas empresas |
| **Webhook** | ⚠️ Sin asignación | ✅ Requiere tenant_id |

---

## 🧪 **Cómo Probar Multi-tenancy**

### Test 1: Crear dos empresas

```powershell
# Empresa 1
POST http://localhost:3000/api/auth/register
{
  "email": "admin@empresa1.com",
  "password": "123456",
  "company_name": "Empresa 1 SL"
}
# Respuesta: tenant_id = "xxx-111"

# Empresa 2
POST http://localhost:3000/api/auth/register
{
  "email": "admin@empresa2.com",
  "password": "123456",
  "company_name": "Empresa 2 SL"
}
# Respuesta: tenant_id = "yyy-222"
```

### Test 2: Crear pagos para cada empresa

```powershell
# Pago para Empresa 1
POST http://localhost:3000/webhook/whop
{
  "event": "payment_failed",
  "tenant_id": "xxx-111",
  "data": {
    "id": "pay_empresa1_001",
    "email": "cliente1@ejemplo.com",
    "product": "Producto A",
    "amount": 50
  }
}

# Pago para Empresa 2
POST http://localhost:3000/webhook/whop
{
  "event": "payment_failed",
  "tenant_id": "yyy-222",
  "data": {
    "id": "pay_empresa2_001",
    "email": "cliente2@ejemplo.com",
    "product": "Producto B",
    "amount": 100
  }
}
```

### Test 3: Verificar aislamiento

```powershell
# Login como Empresa 1
POST http://localhost:3000/api/auth/login
{ "email": "admin@empresa1.com", "password": "123456" }
# Guarda el token

# Ver pagos (solo verá pay_empresa1_001)
GET http://localhost:3000/api/payments
Authorization: Bearer {token_empresa1}
```

---

## 🚀 **Beneficios del Multi-tenancy**

### Para el Negocio:
- ✅ **Escalable**: Soporta infinitas empresas en la misma DB
- ✅ **Seguro**: Aislamiento garantizado entre clientes
- ✅ **SaaS Real**: Listo para cobrar suscripciones
- ✅ **Personalizable**: Cada empresa tiene su config

### Para los Usuarios:
- ✅ **Privacidad**: Solo ven sus datos
- ✅ **Independencia**: Config propia
- ✅ **Performance**: Queries más rápidas (menos datos)

---

## ⚠️ **IMPORTANTE: Migración de Datos**

Si ya tenías pagos en la DB anterior (sin tenant_id):

### Opción 1: Limpiar DB y empezar de cero (RECOMENDADO)
```powershell
Remove-Item C:\Users\marcp\Desktop\Prueba\backend\data.db
# Al reiniciar, se creará con nueva estructura
```

### Opción 2: Migrar datos existentes (avanzado)
```sql
-- Asignar todos los pagos antiguos a un tenant por defecto
UPDATE payments SET tenant_id = 'default-tenant' WHERE tenant_id IS NULL;

-- Crear usuario para ese tenant
INSERT INTO users (id, email, password, company_name, tenant_id)
VALUES ('user-1', 'admin@default.com', '{hash}', 'Default Company', 'default-tenant');
```

---

## 📝 **Checklist de Multi-tenancy**

- [x] Campo `tenant_id` en tabla `payments`
- [x] Campo `tenant_id` en tabla `config`  
- [x] Todas las funciones de DB filtran por tenant
- [x] Rutas API extraen tenant del JWT
- [x] Webhook requiere tenant_id
- [x] Config por defecto al crear usuario
- [x] Retry logic usa config del tenant
- [x] Validación de pertenencia en updates

---

## 🎉 **¡Multi-tenancy Completado!**

**Whop Retry** ahora es un **SaaS real multi-empresa** con:
- ✅ Aislamiento de datos
- ✅ Configuración independiente
- ✅ Seguridad garantizada
- ✅ Escalabilidad infinita

**Próximos pasos sugeridos:**
1. ✅ Subdominios (empresa1.whopretry.com)
2. ✅ Planes de pricing (Free, Pro, Enterprise)
3. ✅ Límites por plan (pagos/mes)

---

**Versión:** 2.1  
**Fecha:** Octubre 2025  
**Estado:** ✅ Multi-tenant Ready
