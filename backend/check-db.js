const db = require('better-sqlite3')('./data.db');

const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
console.log('📋 Tablas en la base de datos:', tables.map(t => t.name).join(', '));

// Ver estructura de tenant_integrations si existe
const tenantIntegrations = tables.find(t => t.name === 'tenant_integrations');
if (tenantIntegrations) {
  const schema = db.prepare("SELECT sql FROM sqlite_master WHERE type='table' AND name='tenant_integrations'").get();
  console.log('\n📊 Estructura de tenant_integrations:');
  console.log(schema.sql);
} else {
  console.log('\n⚠️ Tabla tenant_integrations NO existe');
}

db.close();
