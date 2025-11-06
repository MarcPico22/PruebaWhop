// Simple migration script using direct DB access
const Database = require('better-sqlite3');
const path = require('path');

const dbPath = process.env.DATABASE_URL || (process.env.RAILWAY_ENVIRONMENT ? '/data/database.sqlite' : path.join(__dirname, '..', 'data.db'));
console.log('🚀 Migración: SendGrid/MailerSend → Resend');
console.log(`📂 DB: ${dbPath}`);

const db = new Database(dbPath);

try {
  // Ver estructura actual
  const currentTable = db.prepare("SELECT sql FROM sqlite_master WHERE type='table' AND name='tenant_integrations'").get();
  
  if (!currentTable) {
    console.log('⚠️ tenant_integrations no existe, creando desde cero...');
    db.exec(`
      CREATE TABLE tenant_integrations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        tenant_id TEXT UNIQUE NOT NULL,
        stripe_secret_key TEXT,
        whop_api_key TEXT,
        resend_api_key TEXT,
        from_email TEXT,
        is_stripe_connected INTEGER DEFAULT 0,
        is_whop_connected INTEGER DEFAULT 0,
        is_resend_connected INTEGER DEFAULT 0,
        connected_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (tenant_id) REFERENCES users(tenant_id)
      )
    `);
    console.log('✅ Tabla creada con estructura Resend');
    db.close();
    return;
  }

  console.log('📋 Estructura actual:', currentTable.sql.substring(0, 200) + '...');

  const count = db.prepare('SELECT COUNT(*) as count FROM tenant_integrations').get().count;
  console.log(`📊 Registros a migrar: ${count}`);

  db.exec('BEGIN TRANSACTION');

  // Crear nueva tabla
  db.exec(`
    CREATE TABLE tenant_integrations_new (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tenant_id TEXT UNIQUE NOT NULL,
      stripe_secret_key TEXT,
      whop_api_key TEXT,
      resend_api_key TEXT,
      from_email TEXT,
      is_stripe_connected INTEGER DEFAULT 0,
      is_whop_connected INTEGER DEFAULT 0,
      is_resend_connected INTEGER DEFAULT 0,
      connected_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (tenant_id) REFERENCES users(tenant_id)
    )
  `);

  // Copiar datos
  if (count > 0) {
    db.exec(`
      INSERT INTO tenant_integrations_new 
      (tenant_id, stripe_secret_key, whop_api_key, resend_api_key, from_email, 
       is_stripe_connected, is_whop_connected, is_resend_connected, connected_at)
      SELECT 
        tenant_id, stripe_secret_key, whop_api_key, 
        sendgrid_api_key, from_email,
        is_stripe_connected, is_whop_connected, is_sendgrid_connected, 
        datetime(updated_at, 'unixepoch')
      FROM tenant_integrations
    `);
  }

  // Reemplazar
  db.exec('DROP TABLE tenant_integrations');
  db.exec('ALTER TABLE tenant_integrations_new RENAME TO tenant_integrations');
  
  db.exec('COMMIT');

  console.log('✅ Migración completada!');
  console.log('📋 Nueva estructura: sendgrid_api_key → resend_api_key');

} catch (error) {
  db.exec('ROLLBACK');
  console.error('❌ Error:', error.message);
  process.exit(1);
} finally {
  db.close();
}
