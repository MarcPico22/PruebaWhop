/**
 * Script de migraciones SQL para SQLite
 * Ejecuta las 2 migraciones pendientes usando better-sqlite3
 */

const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

console.log('🚀 Ejecutando migraciones SQL...\n');

// En Railway usa /data/database.sqlite, localmente ./data.db
const dbPath = process.env.RAILWAY_ENVIRONMENT 
  ? '/data/database.sqlite' 
  : (process.env.DATABASE_URL || './data.db');

// Crear directorio si no existe (para Railway)
const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
  console.log(`📁 Creando directorio: ${dbDir}`);
  fs.mkdirSync(dbDir, { recursive: true });
}

try {
  // Conectar a la base de datos
  const db = new Database(dbPath);
  console.log(`✅ Conectado a: ${dbPath}\n`);

  // PASO 0: Inicializar base de datos (crear tablas base si no existen)
  console.log('📝 Paso 0: Inicializar base de datos');
  
  // Crear tabla users
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      company_name TEXT NOT NULL,
      tenant_id TEXT NOT NULL UNIQUE,
      created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
    );
  `);
  
  // Crear tabla payments
  db.exec(`
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
    );
  `);
  
  // Crear tabla config
  db.exec(`
    CREATE TABLE IF NOT EXISTS config (
      key TEXT NOT NULL,
      tenant_id TEXT NOT NULL,
      value TEXT NOT NULL,
      updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
      PRIMARY KEY (key, tenant_id)
    );
  `);
  
  // Crear tabla notification_settings
  db.exec(`
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
    );
  `);
  
  // Crear tabla tenant_integrations
  db.exec(`
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
    );
  `);
  
  // Crear tabla subscriptions
  db.exec(`
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
    );
  `);
  
  console.log('   ✅ Tablas base creadas/verificadas\n');

  // Migración 1: Onboarding columns
  console.log('📝 Migración 1/2: Onboarding columns');
  
  try {
    db.exec('ALTER TABLE users ADD COLUMN onboarding_step INTEGER DEFAULT 0;');
    console.log('   ✅ Columna onboarding_step agregada');
  } catch (err) {
    if (err.message.includes('duplicate column')) {
      console.log('   ⚠️  Columna onboarding_step ya existe (OK)');
    } else {
      throw err;
    }
  }

  try {
    db.exec('ALTER TABLE users ADD COLUMN onboarding_completed_at INTEGER;');
    console.log('   ✅ Columna onboarding_completed_at agregada');
  } catch (err) {
    if (err.message.includes('duplicate column')) {
      console.log('   ⚠️  Columna onboarding_completed_at ya existe (OK)');
    } else {
      throw err;
    }
  }

  // Actualizar usuarios existentes
  db.exec('UPDATE users SET onboarding_step = 0 WHERE onboarding_step IS NULL;');
  console.log('   ✅ Usuarios existentes actualizados\n');

  // Migración 2: Achievements table
  console.log('📝 Migración 2/2: Achievements table');

  const createAchievementsSQL = `
    CREATE TABLE IF NOT EXISTS achievements (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      tenant_id TEXT NOT NULL,
      badge_type TEXT NOT NULL,
      unlocked_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
      metadata TEXT,
      UNIQUE(user_id, badge_type)
    );
  `;

  db.exec(createAchievementsSQL);
  console.log('   ✅ Tabla achievements creada');

  // Crear índices
  db.exec('CREATE INDEX IF NOT EXISTS idx_achievements_user_id ON achievements(user_id);');
  db.exec('CREATE INDEX IF NOT EXISTS idx_achievements_tenant_id ON achievements(tenant_id);');
  console.log('   ✅ Índices creados\n');

  // Verificar estado
  console.log('📊 Estado de la base de datos:');
  
  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name").all();
  console.log('   Tablas:');
  tables.forEach(t => console.log(`     - ${t.name}`));

  // Verificar columnas de users
  console.log('\n   Columnas de users:');
  const userColumns = db.prepare('PRAGMA table_info(users)').all();
  const hasOnboardingStep = userColumns.some(c => c.name === 'onboarding_step');
  const hasOnboardingCompleted = userColumns.some(c => c.name === 'onboarding_completed_at');
  
  console.log(`     - onboarding_step: ${hasOnboardingStep ? '✅' : '❌'}`);
  console.log(`     - onboarding_completed_at: ${hasOnboardingCompleted ? '✅' : '❌'}`);

  // Verificar tabla achievements
  const achievementsExists = tables.some(t => t.name === 'achievements');
  console.log(`\n   Tabla achievements: ${achievementsExists ? '✅' : '❌'}`);

  if (achievementsExists) {
    const achievementsCount = db.prepare('SELECT COUNT(*) as count FROM achievements').get();
    console.log(`     Achievements almacenados: ${achievementsCount.count}`);
  }

  db.close();
  console.log('\n✅ Migraciones completadas exitosamente!');
  console.log('🚀 Ahora puedes iniciar el backend con: npm start\n');

} catch (error) {
  console.error('\n❌ Error durante las migraciones:');
  console.error(error.message);
  console.error('\nStack trace:');
  console.error(error.stack);
  process.exit(1);
}
