const { Pool } = require('pg');

// Conexión a PostgreSQL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

console.log(`✅ PostgreSQL conectado a: ${process.env.DATABASE_URL ? process.env.DATABASE_URL.split('@')[1] || 'DATABASE_URL configurada' : 'localhost'}`);

/**
 * Inicializa la base de datos PostgreSQL con todas las tablas
 */
async function initDatabase() {
  const client = await pool.connect();
  
  try {
    // Tabla users
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        company_name TEXT NOT NULL,
        tenant_id TEXT NOT NULL UNIQUE,
        onboarding_step INTEGER DEFAULT 0,
        onboarding_completed_at BIGINT,
        created_at BIGINT NOT NULL DEFAULT EXTRACT(EPOCH FROM NOW())::BIGINT
      )
    `);
    
    // Tabla payments
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
        created_at BIGINT NOT NULL DEFAULT EXTRACT(EPOCH FROM NOW())::BIGINT,
        tenant_id TEXT,
        customer_name TEXT,
        payment_method_id TEXT
      )
    `);
    
    // Tabla config
    await client.query(`
      CREATE TABLE IF NOT EXISTS config (
        key TEXT NOT NULL,
        tenant_id TEXT NOT NULL,
        value TEXT NOT NULL,
        updated_at BIGINT NOT NULL DEFAULT EXTRACT(EPOCH FROM NOW())::BIGINT,
        PRIMARY KEY (key, tenant_id)
      )
    `);
    
    // Tabla notification_settings
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
        updated_at BIGINT NOT NULL DEFAULT EXTRACT(EPOCH FROM NOW())::BIGINT
      )
    `);
    
    // Tabla tenant_integrations
    await client.query(`
      CREATE TABLE IF NOT EXISTS tenant_integrations (
        tenant_id TEXT PRIMARY KEY,
        stripe_secret_key TEXT,
        stripe_publishable_key TEXT,
        stripe_webhook_secret TEXT,
        resend_api_key TEXT,
        from_email TEXT,
        whop_api_key TEXT,
        is_stripe_connected INTEGER NOT NULL DEFAULT 0,
        is_resend_connected INTEGER NOT NULL DEFAULT 0,
        is_whop_connected INTEGER NOT NULL DEFAULT 0,
        updated_at BIGINT NOT NULL DEFAULT EXTRACT(EPOCH FROM NOW())::BIGINT
      )
    `);
    
    // Tabla subscriptions
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
        created_at BIGINT NOT NULL DEFAULT EXTRACT(EPOCH FROM NOW())::BIGINT,
        updated_at BIGINT NOT NULL DEFAULT EXTRACT(EPOCH FROM NOW())::BIGINT
      )
    `);
    
    // Tabla achievements
    await client.query(`
      CREATE TABLE IF NOT EXISTS achievements (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        tenant_id TEXT NOT NULL,
        badge_type TEXT NOT NULL,
        unlocked_at BIGINT NOT NULL DEFAULT EXTRACT(EPOCH FROM NOW())::BIGINT,
        metadata TEXT,
        UNIQUE(user_id, badge_type)
      )
    `);
    
    // Crear índices
    await client.query(`CREATE INDEX IF NOT EXISTS idx_payments_tenant ON payments(tenant_id)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_payments_next_attempt ON payments(next_attempt)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_achievements_user ON achievements(user_id)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_achievements_tenant ON achievements(tenant_id)`);
    
    console.log('✅ Base de datos PostgreSQL inicializada con todas las tablas');
  } catch (error) {
    console.error('❌ Error inicializando PostgreSQL:', error);
    throw error;
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
    `INSERT INTO payments (id, email, product, amount, status, retries, token, retry_link, next_attempt, tenant_id, customer_name)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
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
      payment.tenant_id,
      payment.customer_name || null
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
async function getPaymentById(id, tenantId = null) {
  let query = 'SELECT * FROM payments WHERE id = $1';
  const params = [id];
  
  if (tenantId) {
    query += ' AND tenant_id = $2';
    params.push(tenantId);
  }
  
  const result = await pool.query(query, params);
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
 * Obtiene configuración (multi-tenant)
 */
async function getConfig(tenantId) {
  const result = await pool.query('SELECT * FROM config WHERE tenant_id = $1', [tenantId]);
  const config = {};
  result.rows.forEach(row => {
    config[row.key] = row.value;
  });
  return config;
}

/**
 * Obtiene un valor de configuración específico
 */
async function getConfigValue(key, tenantId) {
  const result = await pool.query('SELECT value FROM config WHERE key = $1 AND tenant_id = $2', [key, tenantId]);
  return result.rows[0]?.value;
}

/**
 * Actualiza un valor de configuración
 */
async function updateConfig(key, value, tenantId) {
  const now = Math.floor(Date.now() / 1000);
  await pool.query(
    `INSERT INTO config (key, value, tenant_id, updated_at)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (key, tenant_id) 
     DO UPDATE SET value = $2, updated_at = $4`,
    [key, value, tenantId, now]
  );
}

/**
 * Actualiza múltiples valores de configuración
 */
async function updateMultipleConfig(configObj, tenantId) {
  for (const [key, value] of Object.entries(configObj)) {
    await updateConfig(key, value, tenantId);
  }
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
  
  // Crear notification_settings por defecto
  await pool.query(
    `INSERT INTO notification_settings (tenant_id)
     VALUES ($1)
     ON CONFLICT (tenant_id) DO NOTHING`,
    [user.tenant_id]
  );
  
  // Crear tenant_integrations por defecto
  await pool.query(
    `INSERT INTO tenant_integrations (tenant_id)
     VALUES ($1)
     ON CONFLICT (tenant_id) DO NOTHING`,
    [user.tenant_id]
  );
  
  // Crear subscription por defecto
  const trialDays = 14;
  const trialEndsAt = Math.floor(Date.now() / 1000) + (trialDays * 24 * 60 * 60);
  await pool.query(
    `INSERT INTO subscriptions (tenant_id, status, trial_ends_at)
     VALUES ($1, 'trial', $2)
     ON CONFLICT (tenant_id) DO NOTHING`,
    [user.tenant_id, trialEndsAt]
  );
  
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

/**
 * Obtener usuario por Stripe customer ID
 */
async function getUserByStripeCustomer(stripeCustomerId) {
  const result = await pool.query(
    `SELECT u.* FROM users u
     JOIN subscriptions s ON u.tenant_id = s.tenant_id
     WHERE s.stripe_customer_id = $1`,
    [stripeCustomerId]
  );
  return result.rows[0];
}

/**
 * Obtiene las notificaciones del tenant
 */
async function getNotificationSettings(tenantId) {
  const result = await pool.query('SELECT * FROM notification_settings WHERE tenant_id = $1', [tenantId]);
  return result.rows[0];
}

/**
 * Actualiza las notificaciones del tenant
 */
async function updateNotificationSettings(tenantId, settings) {
  const now = Math.floor(Date.now() / 1000);
  const result = await pool.query(
    `INSERT INTO notification_settings (tenant_id, notification_email, email_on_recovery, email_on_failure, 
     daily_summary, weekly_summary, alert_threshold, send_alerts, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     ON CONFLICT (tenant_id) 
     DO UPDATE SET notification_email = $2, email_on_recovery = $3, email_on_failure = $4,
                   daily_summary = $5, weekly_summary = $6, alert_threshold = $7, send_alerts = $8, updated_at = $9
     RETURNING *`,
    [
      tenantId,
      settings.notification_email,
      settings.email_on_recovery ? 1 : 0,
      settings.email_on_failure ? 1 : 0,
      settings.daily_summary ? 1 : 0,
      settings.weekly_summary ? 1 : 0,
      settings.alert_threshold,
      settings.send_alerts ? 1 : 0,
      now
    ]
  );
  return result.rows[0];
}

/**
 * Obtiene las integraciones del tenant
 */
async function getTenantIntegrations(tenantId) {
  const result = await pool.query('SELECT * FROM tenant_integrations WHERE tenant_id = $1', [tenantId]);
  return result.rows[0];
}

/**
 * Actualiza las integraciones del tenant
 */
async function updateTenantIntegrations(tenantId, integrations) {
  const now = Math.floor(Date.now() / 1000);
  const current = await getTenantIntegrations(tenantId);
  
  const updates = {
    stripe_secret_key: integrations.stripe_secret_key !== undefined ? integrations.stripe_secret_key : current?.stripe_secret_key,
    stripe_publishable_key: integrations.stripe_publishable_key !== undefined ? integrations.stripe_publishable_key : current?.stripe_publishable_key,
    stripe_webhook_secret: integrations.stripe_webhook_secret !== undefined ? integrations.stripe_webhook_secret : current?.stripe_webhook_secret,
    resend_api_key: integrations.resend_api_key !== undefined ? integrations.resend_api_key : current?.resend_api_key,
    from_email: integrations.from_email !== undefined ? integrations.from_email : current?.from_email,
    whop_api_key: integrations.whop_api_key !== undefined ? integrations.whop_api_key : current?.whop_api_key,
    is_stripe_connected: integrations.is_stripe_connected !== undefined ? (integrations.is_stripe_connected ? 1 : 0) : (current?.is_stripe_connected || 0),
    is_resend_connected: integrations.is_resend_connected !== undefined ? (integrations.is_resend_connected ? 1 : 0) : (current?.is_resend_connected || 0),
    is_whop_connected: integrations.is_whop_connected !== undefined ? (integrations.is_whop_connected ? 1 : 0) : (current?.is_whop_connected || 0)
  };
  
  const result = await pool.query(
    `INSERT INTO tenant_integrations (tenant_id, stripe_secret_key, stripe_publishable_key, stripe_webhook_secret,
     resend_api_key, from_email, whop_api_key, is_stripe_connected, is_resend_connected, is_whop_connected, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
     ON CONFLICT (tenant_id)
     DO UPDATE SET stripe_secret_key = $2, stripe_publishable_key = $3, stripe_webhook_secret = $4,
                   resend_api_key = $5, from_email = $6, whop_api_key = $7, 
                   is_stripe_connected = $8, is_resend_connected = $9, is_whop_connected = $10, updated_at = $11
     RETURNING *`,
    [
      tenantId,
      updates.stripe_secret_key,
      updates.stripe_publishable_key,
      updates.stripe_webhook_secret,
      updates.resend_api_key,
      updates.from_email,
      updates.whop_api_key,
      updates.is_stripe_connected,
      updates.is_resend_connected,
      updates.is_whop_connected,
      now
    ]
  );
  
  return result.rows[0];
}

/**
 * Obtiene la suscripción de un tenant
 */
async function getSubscription(tenantId) {
  const result = await pool.query('SELECT * FROM subscriptions WHERE tenant_id = $1', [tenantId]);
  return result.rows[0];
}

/**
 * Actualiza la suscripción de un tenant
 */
async function updateSubscription(tenantId, data) {
  const now = Math.floor(Date.now() / 1000);
  const current = await getSubscription(tenantId);
  
  if (!current) {
    // Crear si no existe
    const result = await pool.query(
      `INSERT INTO subscriptions (tenant_id, plan, stripe_customer_id, stripe_subscription_id, status, 
       trial_ends_at, current_period_end, payments_limit, payments_used)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [
        tenantId,
        data.plan || 'free',
        data.stripe_customer_id || null,
        data.stripe_subscription_id || null,
        data.status || 'trial',
        data.trial_ends_at || null,
        data.current_period_end || null,
        data.payments_limit || 50,
        data.payments_used || 0
      ]
    );
    return result.rows[0];
  }
  
  const updates = {
    plan: data.plan !== undefined ? data.plan : current.plan,
    stripe_customer_id: data.stripe_customer_id !== undefined ? data.stripe_customer_id : current.stripe_customer_id,
    stripe_subscription_id: data.stripe_subscription_id !== undefined ? data.stripe_subscription_id : current.stripe_subscription_id,
    status: data.status !== undefined ? data.status : current.status,
    trial_ends_at: data.trial_ends_at !== undefined ? data.trial_ends_at : current.trial_ends_at,
    current_period_end: data.current_period_end !== undefined ? data.current_period_end : current.current_period_end,
    payments_limit: data.payments_limit !== undefined ? data.payments_limit : current.payments_limit,
    payments_used: data.payments_used !== undefined ? data.payments_used : current.payments_used
  };
  
  const result = await pool.query(
    `UPDATE subscriptions
     SET plan = $1, stripe_customer_id = $2, stripe_subscription_id = $3, status = $4,
         trial_ends_at = $5, current_period_end = $6, payments_limit = $7, payments_used = $8, updated_at = $9
     WHERE tenant_id = $10
     RETURNING *`,
    [
      updates.plan,
      updates.stripe_customer_id,
      updates.stripe_subscription_id,
      updates.status,
      updates.trial_ends_at,
      updates.current_period_end,
      updates.payments_limit,
      updates.payments_used,
      now,
      tenantId
    ]
  );
  
  return result.rows[0];
}

/**
 * Incrementa el contador de pagos usados
 */
async function incrementPaymentsUsed(tenantId) {
  const now = Math.floor(Date.now() / 1000);
  const result = await pool.query(
    `UPDATE subscriptions
     SET payments_used = payments_used + 1, updated_at = $1
     WHERE tenant_id = $2
     RETURNING *`,
    [now, tenantId]
  );
  return result.rows[0];
}

/**
 * Resetea el contador de pagos usados (para planes mensuales)
 */
async function resetPaymentsUsed(tenantId) {
  const now = Math.floor(Date.now() / 1000);
  const result = await pool.query(
    `UPDATE subscriptions
     SET payments_used = 0, updated_at = $1
     WHERE tenant_id = $2
     RETURNING *`,
    [now, tenantId]
  );
  return result.rows[0];
}

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
  getConfig,
  getConfigValue,
  updateConfig,
  updateMultipleConfig,
  createUser,
  getUserByEmail,
  getUserByTenantId,
  getUserByStripeCustomer,
  getNotificationSettings,
  updateNotificationSettings,
  getTenantIntegrations,
  updateTenantIntegrations,
  getSubscription,
  updateSubscription,
  incrementPaymentsUsed,
  resetPaymentsUsed
};
