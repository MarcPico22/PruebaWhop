const db = require('./db-adapter');

console.log('🚀 Ejecutando migración: SendGrid/MailerSend → Resend');

try {
  // Verificar tabla actual
  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='tenant_integrations'").all();
  
  if (tables.length === 0) {
    console.log('⚠️ Tabla tenant_integrations no existe, creándola desde cero...');
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
    console.log('✅ Tabla tenant_integrations creada con estructura Resend');
    return;
  }

  // Ver estructura actual
  const schema = db.prepare("SELECT sql FROM sqlite_master WHERE type='table' AND name='tenant_integrations'").get();
  console.log('📋 Estructura actual:');
  console.log(schema.sql);

  db.exec('BEGIN TRANSACTION');

  // Crear nueva tabla
  console.log('\n📝 Creando tenant_integrations_new con columnas Resend...');
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

  // Copiar datos (renombrando sendgrid → resend)
  console.log('📋 Copiando datos (sendgrid_api_key → resend_api_key)...');
  const count = db.prepare('SELECT COUNT(*) as count FROM tenant_integrations').get().count;
  
  if (count > 0) {
    db.exec(`
      INSERT INTO tenant_integrations_new 
      (tenant_id, stripe_secret_key, whop_api_key, resend_api_key, from_email, 
       is_stripe_connected, is_whop_connected, is_resend_connected, connected_at)
      SELECT 
        tenant_id, stripe_secret_key, whop_api_key, sendgrid_api_key, from_email,
        is_stripe_connected, is_whop_connected, is_sendgrid_connected, 
        datetime(updated_at, 'unixepoch')
      FROM tenant_integrations
    `);
    console.log(`✅ ${count} registros copiados`);
  } else {
    console.log('⚠️ No hay datos para migrar');
  }

  // Reemplazar tabla
  console.log('🗑️  Eliminando tenant_integrations antigua...');
  db.exec('DROP TABLE tenant_integrations');
  
  console.log('✏️  Renombrando tenant_integrations_new → tenant_integrations...');
  db.exec('ALTER TABLE tenant_integrations_new RENAME TO tenant_integrations');

  db.exec('COMMIT');

  // Verificar
  const newSchema = db.prepare("SELECT sql FROM sqlite_master WHERE type='table' AND name='tenant_integrations'").get();
  console.log('\n✅ Migración completada!');
  console.log('\n📊 Nueva estructura:');
  console.log(newSchema.sql);

} catch (error) {
  db.exec('ROLLBACK');
  console.error('❌ Error en la migración:', error);
  process.exit(1);
}
