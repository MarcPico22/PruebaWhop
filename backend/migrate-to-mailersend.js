/**
 * Migration Script: SendGrid → MailerSend
 * Renombra columnas en tenant_integrations table
 */

const Database = require('better-sqlite3');
const path = require('path');

// Detectar entorno Railway o local
const dbPath = process.env.RAILWAY_ENVIRONMENT 
  ? '/data/database.sqlite' 
  : (process.env.DATABASE_URL || './data.db');

console.log(`📂 Conectando a base de datos: ${dbPath}`);

const db = new Database(dbPath);

try {
  console.log('\n🚀 Iniciando migración SendGrid → MailerSend...\n');

  // Comenzar transacción
  db.exec('BEGIN TRANSACTION');

  // 1. Crear nueva tabla temporal con nombres correctos
  console.log('1️⃣ Creando tabla temporal...');
  db.exec(`
    CREATE TABLE tenant_integrations_new (
      tenant_id TEXT PRIMARY KEY,
      stripe_secret_key TEXT,
      stripe_publishable_key TEXT,
      stripe_webhook_secret TEXT,
      mailersend_api_key TEXT,
      from_email TEXT,
      whop_api_key TEXT,
      is_stripe_connected INTEGER NOT NULL DEFAULT 0,
      is_mailersend_connected INTEGER NOT NULL DEFAULT 0,
      is_whop_connected INTEGER NOT NULL DEFAULT 0,
      updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
    )
  `);
  console.log('   ✅ Tabla temporal creada');

  // 2. Copiar datos de la tabla antigua a la nueva
  console.log('2️⃣ Copiando datos...');
  const result = db.exec(`
    INSERT INTO tenant_integrations_new (
      tenant_id,
      stripe_secret_key,
      stripe_publishable_key,
      stripe_webhook_secret,
      mailersend_api_key,
      from_email,
      whop_api_key,
      is_stripe_connected,
      is_mailersend_connected,
      is_whop_connected,
      updated_at
    )
    SELECT 
      tenant_id,
      stripe_secret_key,
      stripe_publishable_key,
      stripe_webhook_secret,
      sendgrid_api_key,
      from_email,
      whop_api_key,
      is_stripe_connected,
      is_sendgrid_connected,
      is_whop_connected,
      updated_at
    FROM tenant_integrations
  `);
  console.log('   ✅ Datos copiados');

  // 3. Eliminar tabla antigua
  console.log('3️⃣ Eliminando tabla antigua...');
  db.exec('DROP TABLE tenant_integrations');
  console.log('   ✅ Tabla antigua eliminada');

  // 4. Renombrar nueva tabla
  console.log('4️⃣ Renombrando tabla nueva...');
  db.exec('ALTER TABLE tenant_integrations_new RENAME TO tenant_integrations');
  console.log('   ✅ Tabla renombrada');

  // Commit
  db.exec('COMMIT');

  console.log('\n✅ MIGRACIÓN COMPLETADA EXITOSAMENTE\n');

  // Verificar resultados
  console.log('📊 Verificando schema...');
  const tableInfo = db.prepare("PRAGMA table_info(tenant_integrations)").all();
  const columns = tableInfo.map(col => col.name);
  
  console.log('\n📋 Columnas en tenant_integrations:');
  columns.forEach(col => {
    const icon = col.includes('mailersend') ? '✅' : '  ';
    console.log(`${icon} - ${col}`);
  });

  // Verificar que existan las columnas correctas
  if (columns.includes('mailersend_api_key') && columns.includes('is_mailersend_connected')) {
    console.log('\n🎉 ¡Migración verificada! Columnas MailerSend presentes.');
  } else {
    console.log('\n⚠️ Advertencia: No se encontraron todas las columnas MailerSend');
  }

} catch (error) {
  console.error('\n❌ ERROR EN MIGRACIÓN:');
  console.error(error);
  
  // Rollback en caso de error
  try {
    db.exec('ROLLBACK');
    console.log('🔄 Rollback ejecutado');
  } catch (rollbackError) {
    console.error('❌ Error en rollback:', rollbackError);
  }
  
  process.exit(1);
} finally {
  db.close();
}
