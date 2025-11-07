/**
 * Adaptador de base de datos que detecta y carga el módulo correcto
 * - SQLite: Para desarrollo local
 * - PostgreSQL: Para producción (Railway)
 */

const dbType = process.env.DATABASE_URL?.startsWith('postgres') ? 'postgres' : 'sqlite';

if (dbType === 'postgres') {
  console.log('🐘 Usando adaptador de PostgreSQL');
  module.exports = require('./db-postgres');
} else {
  console.log('📦 Usando adaptador de SQLite');
  module.exports = require('./db');
}
