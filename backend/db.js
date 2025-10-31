const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

// Conexión a SQLite - RAILWAY PERSISTENT VOLUME
// En Railway debes configurar un volumen en /data
const dbPath = process.env.DATABASE_URL || (process.env.RAILWAY_ENVIRONMENT ? '/data/database.sqlite' : './data.db');

// Crear directorio si no existe (para Railway)
const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
  console.log(`✅ Directorio creado: ${dbDir}`);
}

const db = new Database(dbPath);
console.log(`✅ Base de datos conectada: ${dbPath}`);

/**
 * Inicializa la base de datos y crea la tabla payments si no existe
 */
function initDatabase() {
  const createTableSQL = `
    CREATE TABLE IF NOT EXISTS payments (
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
      tenant_id TEXT
    )
  `;
  
  const createConfigTableSQL = `
    CREATE TABLE IF NOT EXISTS config (
      key TEXT NOT NULL,
      tenant_id TEXT NOT NULL,
      value TEXT NOT NULL,
      updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
      PRIMARY KEY (key, tenant_id)
    )
  `;
  
  const createUsersTableSQL = `
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      company_name TEXT NOT NULL,
      tenant_id TEXT NOT NULL UNIQUE,
      created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
    )
  `;
  
  const createNotificationSettingsTableSQL = `
    CREATE TABLE IF NOT EXISTS notification_settings (
      tenant_id TEXT PRIMARY KEY,
      notification_email TEXT,
      email_on_recovery INTEGER NOT NULL DEFAULT 1,
      email_on_failure INTEGER NOT NULL DEFAULT 0,
      daily_summary INTEGER NOT NULL DEFAULT 0,
      weekly_summary INTEGER NOT NULL DEFAULT 0,
      alert_threshold INTEGER NOT NULL DEFAULT 10,
      send_alerts INTEGER NOT NULL DEFAULT 1,
      updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
    )
  `;
  
  const createTenantIntegrationsTableSQL = `
    CREATE TABLE IF NOT EXISTS tenant_integrations (
      tenant_id TEXT PRIMARY KEY,
      stripe_secret_key TEXT,
      stripe_publishable_key TEXT,
      stripe_webhook_secret TEXT,
      sendgrid_api_key TEXT,
      from_email TEXT,
      whop_api_key TEXT,
      is_stripe_connected INTEGER NOT NULL DEFAULT 0,
      is_sendgrid_connected INTEGER NOT NULL DEFAULT 0,
      is_whop_connected INTEGER NOT NULL DEFAULT 0,
      updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
    )
  `;
  
  const createSubscriptionsTableSQL = `
    CREATE TABLE IF NOT EXISTS subscriptions (
      tenant_id TEXT PRIMARY KEY,
      plan TEXT NOT NULL DEFAULT 'free',
      stripe_customer_id TEXT,
      stripe_subscription_id TEXT,
      status TEXT NOT NULL DEFAULT 'trial',
      trial_ends_at INTEGER,
      current_period_end INTEGER,
      payments_limit INTEGER NOT NULL DEFAULT 50,
      payments_used INTEGER NOT NULL DEFAULT 0,
      created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
      updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
    )
  `;
  
  db.exec(createTableSQL);
  db.exec(createConfigTableSQL);
  db.exec(createUsersTableSQL);
  db.exec(createNotificationSettingsTableSQL);
  db.exec(createSubscriptionsTableSQL);
  db.exec(createTenantIntegrationsTableSQL);
  
  // Migración: Agregar columnas de Whop si no existen
  try {
    db.exec(`
      ALTER TABLE tenant_integrations ADD COLUMN whop_api_key TEXT;
    `);
    console.log('✅ Columna whop_api_key agregada');
  } catch (err) {
    // Columna ya existe, ignorar
  }
  
  try {
    db.exec(`
      ALTER TABLE tenant_integrations ADD COLUMN is_whop_connected INTEGER NOT NULL DEFAULT 0;
    `);
    console.log('✅ Columna is_whop_connected agregada');
  } catch (err) {
    // Columna ya existe, ignorar
  }
  
  console.log('✅ Base de datos inicializada');
}

/**
 * Inserta un nuevo pago fallido
 */
function insertPayment(payment) {
  const stmt = db.prepare(`
    INSERT INTO payments (id, email, product, amount, status, retries, token, retry_link, next_attempt, tenant_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  
  const now = Math.floor(Date.now() / 1000);
  const retryIntervals = (process.env.RETRY_INTERVALS || '60,300,900').split(',').map(Number);
  const nextAttempt = now + retryIntervals[0]; // Primer reintento
  
  return stmt.run(
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
  );
}

/**
 * Obtiene todos los pagos con filtro opcional por status (filtrado por tenant)
 */
function getPayments(tenantId, status = null) {
  if (status) {
    return db.prepare('SELECT * FROM payments WHERE tenant_id = ? AND status = ? ORDER BY created_at DESC').all(tenantId, status);
  }
  return db.prepare('SELECT * FROM payments WHERE tenant_id = ? ORDER BY created_at DESC').all(tenantId);
}

/**
 * Obtiene un pago por ID (filtrado por tenant)
 */
function getPaymentById(id, tenantId) {
  return db.prepare('SELECT * FROM payments WHERE id = ? AND tenant_id = ?').get(id, tenantId);
}

/**
 * Obtiene un pago por token (público, sin filtro de tenant)
 */
function getPaymentByToken(token) {
  return db.prepare('SELECT * FROM payments WHERE token = ?').get(token);
}

/**
 * Obtiene pagos pendientes que necesitan reintento
 */
function getPaymentsDueForRetry() {
  const now = Math.floor(Date.now() / 1000);
  return db.prepare(`
    SELECT * FROM payments 
    WHERE status = 'pending' 
    AND next_attempt <= ? 
    AND retries < 3
  `).all(now);
}

/**
 * Actualiza el estado de un pago
 */
function updatePaymentStatus(id, status, retries = null, nextAttempt = null) {
  const now = Math.floor(Date.now() / 1000);
  
  if (retries !== null && nextAttempt !== null) {
    return db.prepare(`
      UPDATE payments 
      SET status = ?, retries = ?, last_attempt = ?, next_attempt = ?
      WHERE id = ?
    `).run(status, retries, now, nextAttempt, id);
  }
  
  return db.prepare(`
    UPDATE payments 
    SET status = ?, last_attempt = ?
    WHERE id = ?
  `).run(status, now, id);
}

/**
 * Obtiene estadísticas del dashboard (filtrado por tenant)
 */
function getStats(tenantId) {
  const total = db.prepare('SELECT COUNT(*) as count FROM payments WHERE tenant_id = ?').get(tenantId).count;
  const pending = db.prepare("SELECT COUNT(*) as count FROM payments WHERE tenant_id = ? AND status = 'pending'").get(tenantId).count;
  const recovered = db.prepare("SELECT COUNT(*) as count FROM payments WHERE tenant_id = ? AND status = 'recovered'").get(tenantId).count;
  const failed = db.prepare("SELECT COUNT(*) as count FROM payments WHERE tenant_id = ? AND status = 'failed-permanent'").get(tenantId).count;
  const totalRecovered = db.prepare("SELECT SUM(amount) as total FROM payments WHERE tenant_id = ? AND status = 'recovered'").get(tenantId).total || 0;
  
  return { total, pending, recovered, failed, totalRecovered };
}

/**
 * Obtiene toda la configuración (filtrado por tenant)
 */
function getConfig(tenantId) {
  const rows = db.prepare('SELECT key, value FROM config WHERE tenant_id = ?').all(tenantId);
  const config = {};
  rows.forEach(row => {
    config[row.key] = row.value;
  });
  return config;
}

/**
 * Obtiene un valor de configuración específico (filtrado por tenant)
 */
function getConfigValue(key, tenantId) {
  const row = db.prepare('SELECT value FROM config WHERE key = ? AND tenant_id = ?').get(key, tenantId);
  return row ? row.value : null;
}

/**
 * Actualiza un valor de configuración (por tenant)
 */
function updateConfig(key, value, tenantId) {
  const now = Math.floor(Date.now() / 1000);
  return db.prepare(`
    INSERT INTO config (key, tenant_id, value, updated_at) 
    VALUES (?, ?, ?, ?)
    ON CONFLICT(key, tenant_id) DO UPDATE SET value = ?, updated_at = ?
  `).run(key, tenantId, value, now, value, now);
}

/**
 * Actualiza múltiples valores de configuración (por tenant)
 */
function updateMultipleConfig(configObj, tenantId) {
  const stmt = db.prepare(`
    INSERT INTO config (key, tenant_id, value, updated_at) 
    VALUES (?, ?, ?, ?)
    ON CONFLICT(key, tenant_id) DO UPDATE SET value = ?, updated_at = ?
  `);
  
  const now = Math.floor(Date.now() / 1000);
  const transaction = db.transaction((configs) => {
    for (const [key, value] of Object.entries(configs)) {
      stmt.run(key, tenantId, value, now, value, now);
    }
  });
  
  transaction(configObj);
  return true;
}

/**
 * Crea un nuevo usuario
 */
function createUser(user) {
  const stmt = db.prepare(`
    INSERT INTO users (id, email, password, company_name, tenant_id)
    VALUES (?, ?, ?, ?, ?)
  `);
  
  const result = stmt.run(user.id, user.email, user.password, user.company_name, user.tenant_id);
  
  // Crear configuración por defecto para este tenant
  const defaultConfig = {
    retry_intervals: process.env.RETRY_INTERVALS || '60,300,900',
    max_retries: '3',
    from_email: process.env.FROM_EMAIL || 'no-reply@local.dev'
  };
  
  updateMultipleConfig(defaultConfig, user.tenant_id);
  
  return result;
}

/**
 * Obtiene un usuario por email
 */
function getUserByEmail(email) {
  return db.prepare('SELECT * FROM users WHERE email = ?').get(email);
}

/**
 * Obtiene un usuario por tenant_id
 */
function getUserByTenantId(tenantId) {
  return db.prepare('SELECT * FROM users WHERE tenant_id = ?').get(tenantId);
}

/**
 * Obtiene la configuración de notificaciones de un tenant
 */
function getNotificationSettings(tenantId) {
  let settings = db.prepare('SELECT * FROM notification_settings WHERE tenant_id = ?').get(tenantId);
  
  // Si no existe, crear con valores por defecto
  if (!settings) {
    const user = getUserByTenantId(tenantId);
    const now = Math.floor(Date.now() / 1000);
    
    db.prepare(`
      INSERT INTO notification_settings (
        tenant_id, 
        notification_email, 
        email_on_recovery, 
        email_on_failure, 
        daily_summary, 
        weekly_summary,
        alert_threshold,
        send_alerts,
        updated_at
      ) VALUES (?, ?, 1, 0, 0, 0, 10, 1, ?)
    `).run(tenantId, user?.email || null, now);
    
    settings = db.prepare('SELECT * FROM notification_settings WHERE tenant_id = ?').get(tenantId);
  }
  
  return settings;
}

/**
 * Actualiza la configuración de notificaciones de un tenant
 */
function updateNotificationSettings(tenantId, settings) {
  const now = Math.floor(Date.now() / 1000);
  const current = getNotificationSettings(tenantId);
  
  const updates = {
    notification_email: settings.notification_email !== undefined ? settings.notification_email : current.notification_email,
    email_on_recovery: settings.email_on_recovery !== undefined ? (settings.email_on_recovery ? 1 : 0) : current.email_on_recovery,
    email_on_failure: settings.email_on_failure !== undefined ? (settings.email_on_failure ? 1 : 0) : current.email_on_failure,
    daily_summary: settings.daily_summary !== undefined ? (settings.daily_summary ? 1 : 0) : current.daily_summary,
    weekly_summary: settings.weekly_summary !== undefined ? (settings.weekly_summary ? 1 : 0) : current.weekly_summary,
    alert_threshold: settings.alert_threshold !== undefined ? settings.alert_threshold : current.alert_threshold,
    send_alerts: settings.send_alerts !== undefined ? (settings.send_alerts ? 1 : 0) : current.send_alerts,
    updated_at: now
  };
  
  db.prepare(`
    UPDATE notification_settings 
    SET notification_email = ?,
        email_on_recovery = ?,
        email_on_failure = ?,
        daily_summary = ?,
        weekly_summary = ?,
        alert_threshold = ?,
        send_alerts = ?,
        updated_at = ?
    WHERE tenant_id = ?
  `).run(
    updates.notification_email,
    updates.email_on_recovery,
    updates.email_on_failure,
    updates.daily_summary,
    updates.weekly_summary,
    updates.alert_threshold,
    updates.send_alerts,
    updates.updated_at,
    tenantId
  );
  
  return getNotificationSettings(tenantId);
}

/**
 * Obtiene las integraciones (API keys) de un tenant
 * NOTA: Las keys están encriptadas en la DB
 */
function getTenantIntegrations(tenantId) {
  let integrations = db.prepare('SELECT * FROM tenant_integrations WHERE tenant_id = ?').get(tenantId);
  
  // Si no existe, crear con valores por defecto
  if (!integrations) {
    const now = Math.floor(Date.now() / 1000);
    
    db.prepare(`
      INSERT INTO tenant_integrations (
        tenant_id,
        is_stripe_connected,
        is_sendgrid_connected,
        updated_at
      ) VALUES (?, 0, 0, ?)
    `).run(tenantId, now);
    
    integrations = db.prepare('SELECT * FROM tenant_integrations WHERE tenant_id = ?').get(tenantId);
  }
  
  return integrations;
}

/**
 * Actualiza las integraciones de un tenant
 * IMPORTANTE: Las keys deben venir ya encriptadas
 */
function updateTenantIntegrations(tenantId, data) {
  const now = Math.floor(Date.now() / 1000);
  const current = getTenantIntegrations(tenantId);
  
  const updates = {
    stripe_secret_key: data.stripe_secret_key !== undefined ? data.stripe_secret_key : current.stripe_secret_key,
    stripe_publishable_key: data.stripe_publishable_key !== undefined ? data.stripe_publishable_key : current.stripe_publishable_key,
    stripe_webhook_secret: data.stripe_webhook_secret !== undefined ? data.stripe_webhook_secret : current.stripe_webhook_secret,
    sendgrid_api_key: data.sendgrid_api_key !== undefined ? data.sendgrid_api_key : current.sendgrid_api_key,
    from_email: data.from_email !== undefined ? data.from_email : current.from_email,
    is_stripe_connected: data.is_stripe_connected !== undefined ? (data.is_stripe_connected ? 1 : 0) : current.is_stripe_connected,
    is_sendgrid_connected: data.is_sendgrid_connected !== undefined ? (data.is_sendgrid_connected ? 1 : 0) : current.is_sendgrid_connected,
    updated_at: now
  };
  
  db.prepare(`
    UPDATE tenant_integrations
    SET stripe_secret_key = ?,
        stripe_publishable_key = ?,
        stripe_webhook_secret = ?,
        sendgrid_api_key = ?,
        from_email = ?,
        is_stripe_connected = ?,
        is_sendgrid_connected = ?,
        updated_at = ?
    WHERE tenant_id = ?
  `).run(
    updates.stripe_secret_key,
    updates.stripe_publishable_key,
    updates.stripe_webhook_secret,
    updates.sendgrid_api_key,
    updates.from_email,
    updates.is_stripe_connected,
    updates.is_sendgrid_connected,
    updates.updated_at,
    tenantId
  );
  
  return getTenantIntegrations(tenantId);
}

/**
 * Obtiene la suscripción de un tenant
 */
function getSubscription(tenantId) {
  let subscription = db.prepare('SELECT * FROM subscriptions WHERE tenant_id = ?').get(tenantId);
  
  // Si no existe, crear suscripción FREE con trial de 14 días
  if (!subscription) {
    const now = Math.floor(Date.now() / 1000);
    const trialEnds = now + (14 * 24 * 60 * 60); // 14 días
    
    db.prepare(`
      INSERT INTO subscriptions (tenant_id, plan, status, trial_ends_at, payments_limit, payments_used)
      VALUES (?, 'free', 'trial', ?, 50, 0)
    `).run(tenantId, trialEnds);
    
    subscription = db.prepare('SELECT * FROM subscriptions WHERE tenant_id = ?').get(tenantId);
  }
  
  return subscription;
}

/**
 * Actualiza la suscripción de un tenant
 */
function updateSubscription(tenantId, data) {
  const now = Math.floor(Date.now() / 1000);
  const current = getSubscription(tenantId);
  
  const updates = {
    plan: data.plan !== undefined ? data.plan : current.plan,
    stripe_customer_id: data.stripe_customer_id !== undefined ? data.stripe_customer_id : current.stripe_customer_id,
    stripe_subscription_id: data.stripe_subscription_id !== undefined ? data.stripe_subscription_id : current.stripe_subscription_id,
    status: data.status !== undefined ? data.status : current.status,
    trial_ends_at: data.trial_ends_at !== undefined ? data.trial_ends_at : current.trial_ends_at,
    current_period_end: data.current_period_end !== undefined ? data.current_period_end : current.current_period_end,
    payments_limit: data.payments_limit !== undefined ? data.payments_limit : current.payments_limit,
    payments_used: data.payments_used !== undefined ? data.payments_used : current.payments_used,
    updated_at: now
  };
  
  db.prepare(`
    UPDATE subscriptions
    SET plan = ?,
        stripe_customer_id = ?,
        stripe_subscription_id = ?,
        status = ?,
        trial_ends_at = ?,
        current_period_end = ?,
        payments_limit = ?,
        payments_used = ?,
        updated_at = ?
    WHERE tenant_id = ?
  `).run(
    updates.plan,
    updates.stripe_customer_id,
    updates.stripe_subscription_id,
    updates.status,
    updates.trial_ends_at,
    updates.current_period_end,
    updates.payments_limit,
    updates.payments_used,
    updates.updated_at,
    tenantId
  );
  
  return getSubscription(tenantId);
}

/**
 * Incrementa el contador de pagos usados
 */
function incrementPaymentsUsed(tenantId) {
  db.prepare(`
    UPDATE subscriptions
    SET payments_used = payments_used + 1,
        updated_at = strftime('%s', 'now')
    WHERE tenant_id = ?
  `).run(tenantId);
  
  return getSubscription(tenantId);
}

/**
 * Resetea el contador de pagos usados (para planes mensuales)
 */
function resetPaymentsUsed(tenantId) {
  db.prepare(`
    UPDATE subscriptions
    SET payments_used = 0,
        updated_at = strftime('%s', 'now')
    WHERE tenant_id = ?
  `).run(tenantId);
  
  return getSubscription(tenantId);
}

module.exports = {
  db,
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
  getNotificationSettings,
  updateNotificationSettings,
  getTenantIntegrations,
  updateTenantIntegrations,
  getSubscription,
  updateSubscription,
  incrementPaymentsUsed,
  resetPaymentsUsed
};
