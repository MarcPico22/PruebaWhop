const Database = require('better-sqlite3');
const path = require('path');

const dbPath = process.env.DATABASE_URL || (process.env.RAILWAY_ENVIRONMENT ? '/data/database.sqlite' : './data.db');
const db = new Database(dbPath);

/**
 * Migración: Añadir columnas de onboarding y crear tabla achievements
 */
function runMigrations() {
  console.log('🔄 Ejecutando migraciones...');

  // Migración 1: Añadir columnas de onboarding a users
  try {
    db.exec(`
      ALTER TABLE users ADD COLUMN onboarding_step INTEGER DEFAULT 0;
    `);
    console.log('✅ Columna onboarding_step añadida a users');
  } catch (error) {
    if (error.message.includes('duplicate column name')) {
      console.log('⏭️  Columna onboarding_step ya existe');
    } else {
      console.error('❌ Error añadiendo onboarding_step:', error.message);
    }
  }

  try {
    db.exec(`
      ALTER TABLE users ADD COLUMN onboarding_completed_at INTEGER;
    `);
    console.log('✅ Columna onboarding_completed_at añadida a users');
  } catch (error) {
    if (error.message.includes('duplicate column name')) {
      console.log('⏭️  Columna onboarding_completed_at ya existe');
    } else {
      console.error('❌ Error añadiendo onboarding_completed_at:', error.message);
    }
  }

  // Migración 2: Crear tabla achievements
  try {
    db.exec(`
      CREATE TABLE IF NOT EXISTS achievements (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        tenant_id TEXT NOT NULL,
        badge_type TEXT NOT NULL,
        unlocked_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
        metadata TEXT,
        UNIQUE(user_id, badge_type),
        FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
      );
    `);
    console.log('✅ Tabla achievements creada');
  } catch (error) {
    console.error('❌ Error creando tabla achievements:', error.message);
  }

  // Migración 3: Crear índices para mejor performance
  try {
    db.exec(`
      CREATE INDEX IF NOT EXISTS idx_achievements_user_id ON achievements(user_id);
    `);
    db.exec(`
      CREATE INDEX IF NOT EXISTS idx_achievements_tenant_id ON achievements(tenant_id);
    `);
    db.exec(`
      CREATE INDEX IF NOT EXISTS idx_users_onboarding_step ON users(onboarding_step);
    `);
    console.log('✅ Índices creados');
  } catch (error) {
    console.error('❌ Error creando índices:', error.message);
  }

  console.log('✅ Migraciones completadas');
}

// Ejecutar migraciones
if (require.main === module) {
  runMigrations();
  db.close();
}

module.exports = { runMigrations };
