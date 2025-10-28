const Database = require('better-sqlite3');
const path = require('path');

// Conexión a SQLite
const dbPath = process.env.DATABASE_URL || './data.db';
const db = new Database(dbPath);

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
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
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
  
  db.exec(createTableSQL);
  db.exec(createConfigTableSQL);
  db.exec(createUsersTableSQL);
  
  // Insertar configuración por defecto si no existe
  const defaultConfig = {
    retry_intervals: process.env.RETRY_INTERVALS || '60,300,900',
    max_retries: '3',
    from_email: process.env.FROM_EMAIL || 'no-reply@local.dev'
  };
  
  for (const [key, value] of Object.entries(defaultConfig)) {
    const existing = db.prepare('SELECT * FROM config WHERE key = ?').get(key);
    if (!existing) {
      db.prepare('INSERT INTO config (key, value) VALUES (?, ?)').run(key, value);
    }
  }
  
  console.log('✅ Base de datos inicializada');
}

/**
 * Inserta un nuevo pago fallido
 */
function insertPayment(payment) {
  const stmt = db.prepare(`
    INSERT INTO payments (id, email, product, amount, status, retries, token, retry_link, next_attempt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
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
    nextAttempt
  );
}

/**
 * Obtiene todos los pagos con filtro opcional por status
 */
function getPayments(status = null) {
  if (status) {
    return db.prepare('SELECT * FROM payments WHERE status = ? ORDER BY created_at DESC').all(status);
  }
  return db.prepare('SELECT * FROM payments ORDER BY created_at DESC').all();
}

/**
 * Obtiene un pago por ID
 */
function getPaymentById(id) {
  return db.prepare('SELECT * FROM payments WHERE id = ?').get(id);
}

/**
 * Obtiene un pago por token
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
 * Obtiene estadísticas del dashboard
 */
function getStats() {
  const total = db.prepare('SELECT COUNT(*) as count FROM payments').get().count;
  const pending = db.prepare("SELECT COUNT(*) as count FROM payments WHERE status = 'pending'").get().count;
  const recovered = db.prepare("SELECT COUNT(*) as count FROM payments WHERE status = 'recovered'").get().count;
  const failed = db.prepare("SELECT COUNT(*) as count FROM payments WHERE status = 'failed-permanent'").get().count;
  const totalRecovered = db.prepare("SELECT SUM(amount) as total FROM payments WHERE status = 'recovered'").get().total || 0;
  
  return { total, pending, recovered, failed, totalRecovered };
}

/**
 * Obtiene toda la configuración
 */
function getConfig() {
  const rows = db.prepare('SELECT key, value FROM config').all();
  const config = {};
  rows.forEach(row => {
    config[row.key] = row.value;
  });
  return config;
}

/**
 * Obtiene un valor de configuración específico
 */
function getConfigValue(key) {
  const row = db.prepare('SELECT value FROM config WHERE key = ?').get(key);
  return row ? row.value : null;
}

/**
 * Actualiza un valor de configuración
 */
function updateConfig(key, value) {
  const now = Math.floor(Date.now() / 1000);
  return db.prepare(`
    INSERT INTO config (key, value, updated_at) 
    VALUES (?, ?, ?)
    ON CONFLICT(key) DO UPDATE SET value = ?, updated_at = ?
  `).run(key, value, now, value, now);
}

/**
 * Actualiza múltiples valores de configuración
 */
function updateMultipleConfig(configObj) {
  const stmt = db.prepare(`
    INSERT INTO config (key, value, updated_at) 
    VALUES (?, ?, ?)
    ON CONFLICT(key) DO UPDATE SET value = ?, updated_at = ?
  `);
  
  const now = Math.floor(Date.now() / 1000);
  const transaction = db.transaction((configs) => {
    for (const [key, value] of Object.entries(configs)) {
      stmt.run(key, value, now, value, now);
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
  
  return stmt.run(user.id, user.email, user.password, user.company_name, user.tenant_id);
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
  getUserByTenantId
};
