const Database = require('better-sqlite3');
const path = require('path');

const dbPath = process.env.DATABASE_URL || path.join(__dirname, '..', 'data.db');
const db = new Database(dbPath);

console.log('🚀 Ejecutando migración: MailerSend → Resend');
console.log(`📂 Base de datos: ${dbPath}`);

try {
  db.exec('BEGIN TRANSACTION');

  // Crear nueva tabla tenant_integrations con columnas Resend
  console.log('📝 Creando tabla tenant_integrations_new con columnas Resend...');
  db.exec(`
    CREATE TABLE IF NOT EXISTS tenant_integrations_new (
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

  // Copiar datos de la tabla antigua (renombrando columnas sendgrid → resend)
  console.log('📋 Copiando datos y renombrando sendgrid_* → resend_*...');
  db.exec(`
    INSERT INTO tenant_integrations_new 
    (tenant_id, stripe_secret_key, whop_api_key, 
     resend_api_key, from_email, is_stripe_connected, is_whop_connected, 
     is_resend_connected, connected_at)
    SELECT 
      tenant_id, stripe_secret_key, whop_api_key,
      sendgrid_api_key, from_email, is_stripe_connected, is_whop_connected,
      is_sendgrid_connected, datetime(updated_at, 'unixepoch')
    FROM tenant_integrations
  `);

  // Borrar tabla antigua
  console.log('🗑️  Eliminando tabla antigua tenant_integrations...');
  db.exec('DROP TABLE tenant_integrations');

  // Renombrar nueva tabla
  console.log('✏️  Renombrando tenant_integrations_new → tenant_integrations...');
  db.exec('ALTER TABLE tenant_integrations_new RENAME TO tenant_integrations');

  db.exec('COMMIT');

  // Verificar migración
  const count = db.prepare('SELECT COUNT(*) as count FROM tenant_integrations').get().count;
  console.log(`✅ Migración completada exitosamente!`);
  console.log(`📊 Registros migrados: ${count}`);
  
  // Mostrar estructura de la nueva tabla
  const schema = db.prepare("SELECT sql FROM sqlite_master WHERE type='table' AND name='tenant_integrations'").get();
  console.log('\n📋 Nueva estructura de tenant_integrations:');
  console.log(schema.sql);

} catch (error) {
  db.exec('ROLLBACK');
  console.error('❌ Error en la migración:', error);
  process.exit(1);
} finally {
  db.close();
}
