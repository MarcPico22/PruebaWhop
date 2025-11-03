# 🐘 GUÍA: Migración de SQLite a PostgreSQL

## ⚠️ POR QUÉ MIGRAR?

### Problemas de SQLite en Producción
- ❌ **No es multi-tenant friendly** - Locks cuando hay múltiples usuarios
- ❌ **ALTER TABLE limitado** - No puedes agregar columnas con `IF NOT EXISTS`
- ❌ **Backups complejos** - Necesitas volúmenes persistentes en Railway
- ❌ **Concurrencia limitada** - Solo un writer a la vez
- ❌ **No es cloud-native** - Dificulta escalabilidad horizontal

### Ventajas de PostgreSQL
- ✅ **Multi-tenant nativo** - Miles de usuarios concurrentes
- ✅ **Migraciones robustas** - `IF NOT EXISTS`, `ALTER COLUMN`, etc.
- ✅ **Backups automáticos** - Railway hace backups diarios
- ✅ **Concurrencia real** - MVCC (Multi-Version Concurrency Control)
- ✅ **Cloud-native** - Railway/Render/Supabase lo ofrecen gratis
- ✅ **JSON support** - Queries avanzados con JSONB
- ✅ **Full-text search** - Búsqueda integrada

---

## 🎯 PLAN DE MIGRACIÓN (3 PASOS)

### PASO 1: Crear PostgreSQL en Railway (5 minutos)

1. **Ir a Railway Dashboard**
   - https://railway.app/dashboard
   - Click en tu proyecto "Whop Recovery"

2. **Agregar PostgreSQL**
   ```
   Click "+ New" → "Database" → "PostgreSQL"
   ```

3. **Copiar DATABASE_URL**
   ```
   Railway generará automáticamente:
   DATABASE_URL=postgresql://user:pass@host:port/database
   ```

4. **Configurar variable en Backend**
   ```
   Railway → Backend Service → Variables
   
   Agregar:
   DATABASE_URL=postgresql://user:pass@host:port/database
   ```

---

### PASO 2: Adaptar el Código (15 minutos)

#### 2.1. Instalar dependencia PostgreSQL

**backend/package.json**
```json
{
  "dependencies": {
    "pg": "^8.11.3",           // NUEVO
    "better-sqlite3": "^9.2.2" // MANTENER para desarrollo local
  }
}
```

Instalar:
```bash
cd backend
npm install pg
```

#### 2.2. Crear adaptador de base de datos

**backend/db-adapter.js** (Ya existe, lo vamos a mejorar)

```javascript
const dbType = process.env.DATABASE_URL?.startsWith('postgres') ? 'postgres' : 'sqlite';

if (dbType === 'postgres') {
  module.exports = require('./db-postgres');
} else {
  module.exports = require('./db');
}
```

#### 2.3. Crear implementación PostgreSQL

**backend/db-postgres.js** (NUEVO - ver código abajo)

Implementa las mismas funciones que `db.js` pero usando `pg` (node-postgres).

---

### PASO 3: Migrar Datos (10 minutos)

#### Opción A: Export/Import Manual (Recomendado)

```bash
# 1. Exportar datos de SQLite a CSV
sqlite3 data.db <<EOF
.mode csv
.headers on
.output users.csv
SELECT * FROM users;
.output payments.csv
SELECT * FROM payments;
.output subscriptions.csv
SELECT * FROM subscriptions;
.quit
EOF

# 2. Importar a PostgreSQL (desde Railway CLI)
railway run psql -c "\COPY users FROM 'users.csv' CSV HEADER"
railway run psql -c "\COPY payments FROM 'payments.csv' CSV HEADER"
railway run psql -c "\COPY subscriptions FROM 'subscriptions.csv' CSV HEADER"
```

#### Opción B: Script Automático (Más fácil)

**backend/migrate-to-postgres.js**
```javascript
// Script que lee SQLite y escribe a PostgreSQL
// Ver código completo abajo
```

Ejecutar:
```bash
node backend/migrate-to-postgres.js
```

---

## 📝 CÓDIGO COMPLETO: PostgreSQL Adapter

### backend/db-postgres.js

```javascript
const { Pool } = require('pg');

// Conexión a PostgreSQL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

console.log(`✅ PostgreSQL conectado`);

/**
 * Inicializa la base de datos PostgreSQL
 */
async function initDatabase() {
  const client = await pool.connect();
  
  try {
    // Crear tabla users
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        company_name TEXT NOT NULL,
        tenant_id TEXT NOT NULL UNIQUE,
        onboarding_step INTEGER DEFAULT 0,
        onboarding_completed_at BIGINT,
        created_at BIGINT NOT NULL DEFAULT EXTRACT(EPOCH FROM NOW())
      )
    `);
    
    // Crear tabla payments
    await client.query(`
      CREATE TABLE IF NOT EXISTS payments (
        id TEXT PRIMARY KEY,
        email TEXT NOT NULL,
        product TEXT NOT NULL,
        amount REAL NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending',
        retries INTEGER NOT NULL DEFAULT 0,
        token TEXT NOT NULL UNIQUE,
        retry_link TEXT,
        last_attempt BIGINT,
        next_attempt BIGINT,
        created_at BIGINT NOT NULL DEFAULT EXTRACT(EPOCH FROM NOW()),
        tenant_id TEXT
      )
    `);
    
    // Crear tabla config
    await client.query(`
      CREATE TABLE IF NOT EXISTS config (
        key TEXT NOT NULL,
        tenant_id TEXT NOT NULL,
        value TEXT NOT NULL,
        updated_at BIGINT NOT NULL DEFAULT EXTRACT(EPOCH FROM NOW()),
        PRIMARY KEY (key, tenant_id)
      )
    `);
    
    // Crear tabla notification_settings
    await client.query(`
      CREATE TABLE IF NOT EXISTS notification_settings (
        tenant_id TEXT PRIMARY KEY,
        notification_email TEXT,
        email_on_recovery INTEGER NOT NULL DEFAULT 1,
        email_on_failure INTEGER NOT NULL DEFAULT 0,
        daily_summary INTEGER NOT NULL DEFAULT 0,
        weekly_summary INTEGER NOT NULL DEFAULT 0,
        alert_threshold INTEGER NOT NULL DEFAULT 10,
        send_alerts INTEGER NOT NULL DEFAULT 1,
        updated_at BIGINT NOT NULL DEFAULT EXTRACT(EPOCH FROM NOW())
      )
    `);
    
    // Crear tabla tenant_integrations
    await client.query(`
      CREATE TABLE IF NOT EXISTS tenant_integrations (
        tenant_id TEXT PRIMARY KEY,
        stripe_secret_key TEXT,
        stripe_publishable_key TEXT,
        stripe_webhook_secret TEXT,
        MailerSend_api_key TEXT,
        from_email TEXT,
        whop_api_key TEXT,
        is_stripe_connected INTEGER NOT NULL DEFAULT 0,
        is_MailerSend_connected INTEGER NOT NULL DEFAULT 0,
        is_whop_connected INTEGER NOT NULL DEFAULT 0,
        updated_at BIGINT NOT NULL DEFAULT EXTRACT(EPOCH FROM NOW())
      )
    `);
    
    // Crear tabla subscriptions
    await client.query(`
      CREATE TABLE IF NOT EXISTS subscriptions (
        tenant_id TEXT PRIMARY KEY,
        plan TEXT NOT NULL DEFAULT 'free',
        stripe_customer_id TEXT,
        stripe_subscription_id TEXT,
        status TEXT NOT NULL DEFAULT 'trial',
        trial_ends_at BIGINT,
        current_period_end BIGINT,
        payments_limit INTEGER NOT NULL DEFAULT 50,
        payments_used INTEGER NOT NULL DEFAULT 0,
        created_at BIGINT NOT NULL DEFAULT EXTRACT(EPOCH FROM NOW()),
        updated_at BIGINT NOT NULL DEFAULT EXTRACT(EPOCH FROM NOW())
      )
    `);
    
    // Crear tabla achievements
    await client.query(`
      CREATE TABLE IF NOT EXISTS achievements (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        tenant_id TEXT NOT NULL,
        badge_type TEXT NOT NULL,
        unlocked_at BIGINT NOT NULL DEFAULT EXTRACT(EPOCH FROM NOW()),
        metadata TEXT,
        UNIQUE(user_id, badge_type)
      )
    `);
    
    // Crear índices
    await client.query(`CREATE INDEX IF NOT EXISTS idx_payments_tenant ON payments(tenant_id)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_achievements_user ON achievements(user_id)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_achievements_tenant ON achievements(tenant_id)`);
    
    console.log('✅ Base de datos PostgreSQL inicializada');
  } finally {
    client.release();
  }
}

/**
 * Inserta un nuevo pago
 */
async function insertPayment(payment) {
  const now = Math.floor(Date.now() / 1000);
  const retryIntervals = (process.env.RETRY_INTERVALS || '60,300,900').split(',').map(Number);
  const nextAttempt = now + retryIntervals[0];
  
  const result = await pool.query(
    `INSERT INTO payments (id, email, product, amount, status, retries, token, retry_link, next_attempt, tenant_id)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
     RETURNING *`,
    [
      payment.id,
      payment.email,
      payment.product,
      payment.amount,
      payment.status || 'pending',
      payment.retries || 0,
      payment.token,
      payment.retry_link,
      nextAttempt,
      payment.tenant_id
    ]
  );
  
  return result.rows[0];
}

/**
 * Obtiene todos los pagos (filtrado por tenant)
 */
async function getPayments(tenantId, status = null) {
  let query = 'SELECT * FROM payments WHERE tenant_id = $1';
  const params = [tenantId];
  
  if (status) {
    query += ' AND status = $2 ORDER BY created_at DESC';
    params.push(status);
  } else {
    query += ' ORDER BY created_at DESC';
  }
  
  const result = await pool.query(query, params);
  return result.rows;
}

/**
 * Obtiene un pago por ID
 */
async function getPaymentById(id, tenantId) {
  const result = await pool.query(
    'SELECT * FROM payments WHERE id = $1 AND tenant_id = $2',
    [id, tenantId]
  );
  return result.rows[0];
}

/**
 * Obtiene un pago por token
 */
async function getPaymentByToken(token) {
  const result = await pool.query('SELECT * FROM payments WHERE token = $1', [token]);
  return result.rows[0];
}

/**
 * Obtiene pagos pendientes que necesitan reintento
 */
async function getPaymentsDueForRetry() {
  const now = Math.floor(Date.now() / 1000);
  const result = await pool.query(
    `SELECT * FROM payments 
     WHERE status = 'pending' 
     AND next_attempt <= $1 
     AND retries < 3`,
    [now]
  );
  return result.rows;
}

/**
 * Actualiza el estado de un pago
 */
async function updatePaymentStatus(id, status, retries = null, nextAttempt = null) {
  const now = Math.floor(Date.now() / 1000);
  
  if (retries !== null && nextAttempt !== null) {
    const result = await pool.query(
      `UPDATE payments 
       SET status = $1, retries = $2, last_attempt = $3, next_attempt = $4
       WHERE id = $5
       RETURNING *`,
      [status, retries, now, nextAttempt, id]
    );
    return result.rows[0];
  }
  
  const result = await pool.query(
    `UPDATE payments 
     SET status = $1, last_attempt = $2
     WHERE id = $3
     RETURNING *`,
    [status, now, id]
  );
  return result.rows[0];
}

/**
 * Obtiene estadísticas (filtrado por tenant)
 */
async function getStats(tenantId) {
  const total = await pool.query('SELECT COUNT(*) as count FROM payments WHERE tenant_id = $1', [tenantId]);
  const pending = await pool.query("SELECT COUNT(*) as count FROM payments WHERE tenant_id = $1 AND status = 'pending'", [tenantId]);
  const recovered = await pool.query("SELECT COUNT(*) as count FROM payments WHERE tenant_id = $1 AND status = 'recovered'", [tenantId]);
  const failed = await pool.query("SELECT COUNT(*) as count FROM payments WHERE tenant_id = $1 AND status = 'failed-permanent'", [tenantId]);
  const totalRecoveredResult = await pool.query("SELECT SUM(amount) as total FROM payments WHERE tenant_id = $1 AND status = 'recovered'", [tenantId]);
  
  return {
    total: parseInt(total.rows[0].count),
    pending: parseInt(pending.rows[0].count),
    recovered: parseInt(recovered.rows[0].count),
    failed: parseInt(failed.rows[0].count),
    totalRecovered: parseFloat(totalRecoveredResult.rows[0].total || 0)
  };
}

/**
 * Crear usuario
 */
async function createUser(user) {
  const result = await pool.query(
    `INSERT INTO users (id, email, password, company_name, tenant_id)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [user.id, user.email, user.password, user.company_name, user.tenant_id]
  );
  
  // Crear config por defecto
  const defaultConfig = {
    retry_intervals: process.env.RETRY_INTERVALS || '60,300,900',
    max_retries: '3',
    from_email: process.env.FROM_EMAIL || 'no-reply@local.dev'
  };
  
  await updateMultipleConfig(defaultConfig, user.tenant_id);
  
  return result.rows[0];
}

/**
 * Obtener usuario por email
 */
async function getUserByEmail(email) {
  const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
  return result.rows[0];
}

/**
 * Obtener usuario por tenant_id
 */
async function getUserByTenantId(tenantId) {
  const result = await pool.query('SELECT * FROM users WHERE tenant_id = $1', [tenantId]);
  return result.rows[0];
}

// ... (continuar con las demás funciones adaptadas a PostgreSQL)

module.exports = {
  pool,
  initDatabase,
  insertPayment,
  getPayments,
  getPaymentById,
  getPaymentByToken,
  getPaymentsDueForRetry,
  updatePaymentStatus,
  getStats,
  createUser,
  getUserByEmail,
  getUserByTenantId,
  // ... exportar todas las funciones
};
```

---

## 🚀 EJECUCIÓN: Migración en 3 Comandos

```bash
# 1. Crear PostgreSQL en Railway (Dashboard)
# 2. Copiar DATABASE_URL a variables de Railway
# 3. Redeploy (automático)

# Local: Cambiar a PostgreSQL
export DATABASE_URL=postgresql://localhost/whop_recovery
npm install pg
npm start
```

---

## ✅ CHECKLIST DE MIGRACIÓN

### Pre-migración
- [ ] Backup de SQLite actual: `cp data.db data.db.backup`
- [ ] PostgreSQL creado en Railway
- [ ] `DATABASE_URL` configurada en variables

### Durante migración
- [ ] `npm install pg` en backend
- [ ] Crear `db-postgres.js` (copiar código de arriba)
- [ ] Actualizar `db-adapter.js`
- [ ] Ejecutar script de migración de datos

### Post-migración
- [ ] Verificar que todas las tablas existen
- [ ] Probar login/signup
- [ ] Probar dashboard
- [ ] Probar achievements
- [ ] Verificar migraciones futuras funcionan

---

## 🎯 COMPARACIÓN: SQLite vs PostgreSQL

| Feature | SQLite | PostgreSQL |
|---------|--------|------------|
| **Setup** | ✅ Fácil (1 archivo) | ⚠️ Medio (servicio) |
| **Concurrencia** | ❌ 1 writer | ✅ Miles de users |
| **Migraciones** | ❌ Limitadas | ✅ Robustas |
| **Backups** | ⚠️ Manual | ✅ Automáticos |
| **Costo Railway** | ✅ Gratis (con volumen) | ✅ Gratis (500MB) |
| **Escalabilidad** | ❌ Vertical solo | ✅ Horizontal |
| **JSON support** | ⚠️ Básico | ✅ Nativo (JSONB) |
| **Full-text** | ❌ Extensión | ✅ Nativo |

---

## 🔥 RECOMENDACIÓN FINAL

**PARA BETA/MVP**: SQLite está bien (lo que tienes ahora)

**PARA PRODUCCIÓN**: PostgreSQL es obligatorio cuando:
- Más de 10 usuarios concurrentes
- Más de 1,000 pagos/día
- Necesitas reporting avanzado
- Planeas escalar a múltiples regiones

**Timeline sugerido**:
1. **Ahora**: Lanzar con SQLite
2. **Semana 1-2**: Migrar a PostgreSQL
3. **Mes 1**: Optimizar queries

---

## 📚 RECURSOS

- **Railway PostgreSQL**: https://docs.railway.app/databases/postgresql
- **node-postgres (pg)**: https://node-postgres.com/
- **Migraciones**: https://github.com/salsita/node-pg-migrate

---

**¿Necesitas ayuda con la migración?** Puedo generar el código completo de `db-postgres.js` y el script de migración.
