# 🚀 Cómo Usar el Sistema Multi-Tenant v2.4

Esta guía rápida te ayudará a empezar a usar el sistema después de la instalación.

---

## 📋 Pre-requisitos

Antes de empezar, asegúrate de tener:

- [x] Node.js instalado (v16 o superior)
- [x] Backend y Frontend instalados (`npm install` en ambos)
- [x] `.env` configurado con `ENCRYPTION_SECRET` y `JWT_SECRET`
- [x] Base de datos creada (se crea automáticamente al iniciar)

---

## 🔧 Configuración Inicial (Primera Vez)

### 1. Iniciar el Backend

```powershell
cd c:\Users\marcp\Desktop\Prueba\backend
npm run dev
```

Deberías ver:
```
🚀 Servidor backend corriendo en http://localhost:3000
✅ Base de datos inicializada: ./data.db
🔄 Scheduler de reintentos iniciado (cada 30 segundos)
```

### 2. Iniciar el Frontend

**En otra terminal:**
```powershell
cd c:\Users\marcp\Desktop\Prueba\frontend
npm run dev
```

Deberías ver:
```
VITE v5.x.x ready in XXX ms
➜  Local: http://localhost:5173/
```

### 3. Abrir el Dashboard

Abre tu navegador en: **http://localhost:5173**

---

## 👤 Crear tu Primera Cuenta

### Registro

1. En el dashboard, verás un formulario de **Login/Registro**
2. Completa:
   - **Email:** tu-email@empresa.com
   - **Password:** tu-password-seguro
3. Haz clic en **"Registrarse"**

✅ **Cuenta creada** - Ahora estás logueado automáticamente.

---

## 🔌 Configurar Integraciones (IMPORTANTE)

Para que el sistema funcione, **DEBES** configurar tus API keys de Stripe y SendGrid.

### Opción 1: Usar Keys Reales (RECOMENDADO)

#### Configurar Stripe

1. Ve a **⚙️ Settings → 🔌 Integraciones → 💳 Stripe**
2. Obtén tus keys de Stripe:
   - Ve a [https://dashboard.stripe.com/apikeys](https://dashboard.stripe.com/apikeys)
   - Copia **Secret Key** (empieza con `sk_test_...`)
   - Copia **Publishable Key** (empieza con `pk_test_...`)
3. Pega las keys en el formulario
4. Haz clic en **"Guardar Stripe"**

✅ Deberías ver: **"✅ Stripe configurado correctamente"**

#### Configurar SendGrid

1. Ve a **⚙️ Settings → 🔌 Integraciones → 📧 SendGrid**
2. Obtén tu API key de SendGrid:
   - Ve a [https://app.sendgrid.com/settings/api_keys](https://app.sendgrid.com/settings/api_keys)
   - Crea una nueva API key (Full Access)
   - Copia la key (empieza con `SG.`)
3. **Verifica tu email remitente** en SendGrid:
   - Ve a Settings → Sender Authentication
   - Verifica un email (ej: no-reply@tuempresa.com)
4. Pega la API key y el email verificado en el formulario
5. Haz clic en **"Guardar SendGrid"**

✅ Deberías ver: **"✅ SendGrid configurado correctamente"**

**👉 Guía detallada para empresas:** Lee [SETUP-EMPRESAS.md](./SETUP-EMPRESAS.md)

### Opción 2: Usar Keys de DEMO (Solo Testing)

Si solo quieres probar el sistema sin configurar Stripe/SendGrid:

1. Edita `backend/.env`:
   ```bash
   DEMO_STRIPE_SECRET_KEY=sk_test_tu_key_de_stripe
   DEMO_SENDGRID_API_KEY=SG.tu_key_de_sendgrid
   DEMO_FROM_EMAIL=no-reply@demo.local
   ```
2. Reinicia el backend
3. El sistema usará estas keys si no tienes configuradas tus propias keys

⚠️ **Importante:** En DEMO mode, todos los tenants comparten las mismas keys. No usar en producción.

---

## 💰 Crear tu Primer Pago de Prueba

### Desde el Dashboard

1. Ve a **💰 Pagos**
2. Haz clic en **"Crear pago de prueba"**
3. El sistema creará automáticamente un pago fallido

✅ Deberías ver:
- Un nuevo pago en la lista con estado **"Pendiente"**
- Email en tu bandeja de entrada: **"⚠️ Pago fallido"**

### Desde API (Avanzado)

```powershell
# Obtener token JWT
$token = "tu_token_jwt_del_login"

# Crear pago de prueba
Invoke-RestMethod -Uri "http://localhost:3000/api/test-payment" `
  -Method POST `
  -Headers @{ Authorization = "Bearer $token" }
```

---

## 🔄 Ver Reintentos Automáticos

El sistema intenta recuperar pagos automáticamente.

### Configurar Intervalos

1. Ve a **⚙️ Settings → 🔧 General**
2. Modifica **"Intervalos de Reintento"**:
   - Por defecto: `60,300,900` (1min, 5min, 15min)
   - Para testing rápido: `10,20,30` (10s, 20s, 30s)
3. Modifica **"Máximo de Reintentos"**: 3 (recomendado)
4. Haz clic en **"Guardar Cambios"**

### Observar Reintentos

1. Ve a **💰 Pagos**
2. Observa la columna **"Reintentos"**:
   - Aumenta automáticamente cada intervalo
   - Eventualmente el pago se recupera (30% probabilidad)
3. Cuando se recupera, verás:
   - Estado cambia a **"Recovered"** (verde)
   - Email: **"✅ ¡Pago completado!"**

---

## 🎨 Interfaz del Dashboard

### Vista de Pagos

- **Estado:**
  - 🟡 **Pending** → Esperando reintento
  - 🟢 **Recovered** → Pago recuperado exitosamente
  - 🔴 **Failed-permanent** → Falló después de todos los reintentos

- **Columnas:**
  - **Email:** Cliente
  - **Producto:** Qué compró
  - **Monto:** Cuánto debe
  - **Estado:** Estado actual
  - **Reintentos:** Intentos realizados
  - **Próximo Intento:** Cuándo se volverá a intentar
  - **Acciones:** Reintentar manualmente

### Filtros

Usa los botones de filtro para ver:
- **Todos los pagos**
- **Solo Pendientes**
- **Solo Recuperados**
- **Solo Fallidos Permanentes**

---

## 📧 Emails Automáticos

El sistema envía 4 tipos de emails:

### 1. Pago Fallido (Inicial)
**Cuándo:** Cuando un pago falla por primera vez  
**Contenido:** Notifica el fallo, link para reintentar manualmente  
**Asunto:** "Tu pago para [producto] falló — reintenta aquí"

### 2. Reintento Fallido
**Cuándo:** Cuando un reintento automático falla  
**Contenido:** Informa intento X de N, link para reintentar  
**Asunto:** "Reintento X para [producto] — aún sin éxito"

### 3. Pago Recuperado
**Cuándo:** Cuando el pago finalmente se procesa  
**Contenido:** Confirma pago exitoso  
**Asunto:** "✅ Pago exitoso para [producto]"

### 4. Fallo Permanente
**Cuándo:** Después de agotar todos los reintentos  
**Contenido:** Informa que no se pudo procesar, contactar soporte  
**Asunto:** "No pudimos procesar tu pago para [producto]"

---

## 🧪 Probar el Sistema

### Test Completo

1. **Crear pago de prueba** (ver arriba)
2. **Verificar email de "Pago fallido"** en tu bandeja
3. **Esperar ~1 minuto** (o el intervalo configurado)
4. **Verificar que el contador de reintentos aumenta**
5. **Eventualmente el pago se recupera** (30% probabilidad por intento)
6. **Verificar email de "Pago recuperado"**

### Tarjetas de Prueba de Stripe

Si integras con Stripe real, usa estas tarjetas:

| Número | Resultado |
|---|---|
| `4242 4242 4242 4242` | Pago exitoso ✅ |
| `4000 0000 0000 0002` | Tarjeta rechazada ❌ |
| `4000 0000 0000 9995` | Fondos insuficientes 💰 |

- **Expiración:** Cualquier fecha futura (ej: 12/25)
- **CVC:** Cualquier 3 dígitos (ej: 123)

Más: [https://stripe.com/docs/testing](https://stripe.com/docs/testing)

---

## 🔒 Seguridad

### Keys Encriptadas

Todas tus API keys se guardan **encriptadas** en la base de datos:

```
# En la base de datos (tenant_integrations)
stripe_secret_key: "a1b2c3d4e5:9f8e7d6c5b4a3b2c1a..."  # Encriptado

# En la UI
Stripe Secret Key: sk_test_•••••••456  # Enmascarado
```

### Nunca Compartir

❌ **NUNCA compartas:**
- `ENCRYPTION_SECRET` del `.env`
- `JWT_SECRET` del `.env`
- API keys de Stripe/SendGrid

✅ **Puedes compartir:**
- Documentación (`SETUP-EMPRESAS.md`)
- Screenshots de la UI (las keys están enmascaradas)

---

## 📊 Monitoreo

### Logs del Backend

El backend loguea en consola:

```
✅ Pago pay_123 recuperado exitosamente
⏳ Pago pay_456 reintento 2/3, siguiente en 300s
❌ Pago pay_789 marcado como fallo permanente (3 intentos)
📧 EMAIL enviado a cliente@ejemplo.com
```

### Dashboard en Tiempo Real

El dashboard se actualiza automáticamente cada pocos segundos.

---

## ❓ Problemas Comunes

### "Error: Esta empresa no ha configurado Stripe"

**Solución:** Ve a Settings → Integraciones → Stripe y configura tus keys.

### "Error: SendGrid API key inválida"

**Solución:** Verifica que:
1. La key empieza con `SG.`
2. Copiaste la key completa
3. El email remitente está verificado en SendGrid

### Emails no llegan

**Solución:**
1. Revisa spam/correo no deseado
2. Verifica que el email remitente esté verificado en SendGrid
3. Revisa logs del backend (consola)

### Base de datos no se crea

**Solución:**
```powershell
# Detén el servidor
# Elimina la BD antigua
Remove-Item c:\Users\marcp\Desktop\Prueba\backend\data.db
# Reinicia el servidor
npm run dev
```

---

## 🆘 Ayuda

- **Documentación completa:** [README-v2.4.md](./README-v2.4.md)
- **Guía para empresas:** [SETUP-EMPRESAS.md](./SETUP-EMPRESAS.md)
- **Migración desde v2.3:** [MIGRACION-v2.3-a-v2.4.md](./MIGRACION-v2.3-a-v2.4.md)
- **Resumen técnico:** [RESUMEN-v2.4.md](./RESUMEN-v2.4.md)

---

**¡Listo! Ya puedes usar el sistema para recuperar pagos fallidos** 🎉

**Próximos pasos:**
1. Configurar con tus keys reales de Stripe y SendGrid
2. Integrar el webhook de Stripe en tu tienda
3. Empezar a recuperar pagos de clientes reales
