/**
 * Script de migraciones SQL para SQLite
 * Ejecuta las 2 migraciones pendientes usando better-sqlite3
 */

const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

console.log('🚀 Ejecutando migraciones SQL...\n');

const dbPath = process.env.DATABASE_URL || './data.db';

try {
  // Conectar a la base de datos
  const db = new Database(dbPath);
  console.log(`✅ Conectado a: ${dbPath}\n`);

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
