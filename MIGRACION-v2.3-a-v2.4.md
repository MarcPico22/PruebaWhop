# 🔄 Guía de Migración: v2.3 → v2.4 (Multi-Tenant Keys)

Esta guía te ayudará a migrar de la versión 2.3 (keys globales) a la versión 2.4 (keys por tenant encriptadas).

---

## ⚠️ IMPORTANTE: Cambios que rompen compatibilidad

La v2.4 cambia **fundamentalmente** cómo se manejan las API keys:

| v2.3 (Antes) | v2.4 (Ahora) |
|---|---|
| Una sola cuenta de Stripe global | Cada tenant tiene su propia cuenta |
| Keys en `.env` | Keys encriptadas en DB (`tenant_integrations`) |
| Todos los pagos en una cuenta | Cada tenant recibe pagos en su cuenta |

---

## 🔧 Pasos de Migración

### 1. Actualizar código

```bash
# Asegúrate de estar en la rama correcta
git pull origin main

# Instalar dependencias (si hay nuevas)
cd backend
npm install

cd ../frontend
npm install
```

### 2. Generar ENCRYPTION_SECRET

```bash
cd backend
node generate-secret.js
```

Copia el secret generado.

### 3. Actualizar `.env`

**ANTES (v2.3):**
```bash
PORT=3000
DATABASE_URL=./data.db
SENDGRID_API_KEY=SG.ABC123...
FROM_EMAIL=no-reply@tuempresa.com
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

**AHORA (v2.4):**
```bash
PORT=3000
DATABASE_URL=./data.db

# REQUERIDO: Secret para encriptar API keys
ENCRYPTION_SECRET=<pega_aqui_el_secret_generado>

# REQUERIDO: Secret para JWT
JWT_SECRET=tu_secret_jwt_super_seguro

# OPCIONAL: Keys de demo para testing
DEMO_STRIPE_SECRET_KEY=sk_test_...
DEMO_SENDGRID_API_KEY=SG.ABC123...
DEMO_FROM_EMAIL=no-reply@demo.local
```

### 4. Opción A: Base de datos nueva (RECOMENDADO)

Si estás en desarrollo o no tienes datos importantes:

```bash
# Eliminar base de datos antigua
rm backend/data.db

# La nueva se creará automáticamente con la estructura correcta
npm run dev
```

### 5. Opción B: Migrar datos existentes

Si tienes datos en producción que necesitas conservar:

**Crear migration script:**

```sql
-- backend/migrate-v2.3-to-v2.4.sql

-- 1. Crear nueva tabla de integraciones
CREATE TABLE IF NOT EXISTS tenant_integrations (
  tenant_id TEXT PRIMARY KEY,
  stripe_secret_key TEXT,
  stripe_publishable_key TEXT,
  stripe_webhook_secret TEXT,
  sendgrid_api_key TEXT,
  from_email TEXT,
  is_stripe_connected INTEGER DEFAULT 0,
  is_sendgrid_connected INTEGER DEFAULT 0,
  created_at INTEGER DEFAULT (strftime('%s', 'now')),
  updated_at INTEGER DEFAULT (strftime('%s', 'now'))
);

-- 2. Si tenías UN tenant con keys globales, puedes migrar manualmente:
-- (Esto es solo un ejemplo - necesitarás hacerlo desde el código con encriptación)
-- INSERT INTO tenant_integrations (tenant_id, sendgrid_api_key, from_email, is_sendgrid_connected)
-- VALUES ('tenant_id_del_admin', '<key_encriptada>', 'no-reply@tuempresa.com', 1);
```

**Ejecutar migración con código:**

```javascript
// backend/migrate.js
const crypto = require('crypto');
const { getTenantIntegrations, updateTenantIntegrations } = require('./db');
const { encrypt } = require('./encryption');

async function migrate() {
  // Si tenías un tenant principal con ID '1' o 'admin'
  const tenantId = '1'; // Cambia esto al ID real de tu tenant
  
  // Keys antiguas del .env
  const oldStripeKey = 'sk_test_...'; // De tu .env antiguo
  const oldSendGridKey = 'SG...'; // De tu .env antiguo
  const oldFromEmail = 'no-reply@tuempresa.com';
  
  // Encriptar y guardar
  const data = {
    stripe_secret_key: encrypt(oldStripeKey),
    sendgrid_api_key: encrypt(oldSendGridKey),
    from_email: oldFromEmail,
    is_stripe_connected: 1,
    is_sendgrid_connected: 1
  };
  
  updateTenantIntegrations(tenantId, data);
  console.log('✅ Migración completada');
}

migrate();
```

### 6. Reiniciar servidor

```bash
cd backend
npm run dev
```

### 7. Verificar en la UI

1. Inicia sesión en el dashboard
2. Ve a **⚙️ Settings → 🔌 Integraciones**
3. Si la migración funcionó, verás:
   - ✅ Stripe conectado (keys enmascaradas: `sk_test_•••••••456`)
   - ✅ SendGrid conectado (key enmascarada: `SG.•••••••XYZ`)

---

## 🧪 Probar que funciona

### Test 1: Crear pago de prueba

```bash
# Desde el dashboard
1. Ve a "Pagos"
2. Clic en "Crear pago de prueba"
3. Verifica que se crea correctamente
```

### Test 2: Verificar email

```bash
# Revisa tu bandeja de entrada
# Deberías recibir un email de "Pago fallido"
# El remitente debe ser tu email configurado en SendGrid
```

### Test 3: Reintentos automáticos

```bash
# Espera ~1 minuto
# Verifica en el dashboard que:
# - El contador de reintentos aumenta
# - Eventualmente el pago se recupera (30% probabilidad)
```

---

## ❗ Problemas Comunes

### Error: "ENCRYPTION_SECRET no está definido"

```bash
# Solución:
cd backend
node generate-secret.js
# Copia el secret al .env
```

### Error: "table tenant_integrations already exists"

```bash
# La tabla ya existe de una migración previa
# Verifica que tenga la estructura correcta:
sqlite3 backend/data.db
> .schema tenant_integrations
```

### Keys antiguas en .env no se migran automáticamente

```bash
# Necesitas hacerlo manualmente desde la UI:
1. Inicia sesión
2. Ve a Settings → Integraciones
3. Pega tus keys antiguas
4. Guarda
```

### "Esta empresa no ha configurado Stripe"

```bash
# El tenant no tiene keys configuradas
# Solución:
1. Ve a Settings → Integraciones → Stripe
2. Configura las keys
3. Guarda
```

---

## 🔄 Rollback (Volver a v2.3)

Si algo sale mal y necesitas volver:

```bash
# 1. Restaura tu .env antiguo
cp .env.backup .env

# 2. Restaura la base de datos antigua (si hiciste backup)
cp data.db.backup data.db

# 3. Vuelve al commit anterior
git checkout v2.3

# 4. Reinstala dependencias
npm install
```

---

## 📋 Checklist de Migración

- [ ] Código actualizado (`git pull`)
- [ ] Dependencias instaladas (`npm install`)
- [ ] `ENCRYPTION_SECRET` generado y en `.env`
- [ ] `JWT_SECRET` configurado en `.env`
- [ ] Base de datos migrada o recreada
- [ ] Servidor backend reiniciado
- [ ] Keys de Stripe configuradas en UI
- [ ] Keys de SendGrid configuradas en UI
- [ ] Email remitente verificado en SendGrid
- [ ] Test de pago de prueba exitoso
- [ ] Email de "Pago fallido" recibido
- [ ] Reintentos automáticos funcionan

---

## 🆘 Soporte

Si tienes problemas:

1. Revisa los logs del backend (`console.log`)
2. Verifica que ENCRYPTION_SECRET esté en `.env`
3. Verifica que las keys de Stripe/SendGrid sean correctas
4. Contacta a soporte: soporte@tuempresa.com

---

**Migración completada → Ahora tienes multi-tenant keys encriptadas** 🎉
