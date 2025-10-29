/**
 * Adaptador de base de datos que funciona con SQLite y PostgreSQL
 */

const isProduction = process.env.NODE_ENV === 'production' && process.env.DATABASE_URL;

/**
 * Ejecuta una query (para SQLite o PostgreSQL)
 */
async function query(db, pool, sql, params = []) {
  if (isProduction) {
    // PostgreSQL
    const result = await pool.query(sql, params);
    return result.rows;
  } else {
    // SQLite
    if (sql.trim().toUpperCase().startsWith('SELECT')) {
      const stmt = db.prepare(sql);
      return params.length ? stmt.all(...params) : stmt.all();
    } else {
      const stmt = db.prepare(sql);
      return params.length ? stmt.run(...params) : stmt.run();
    }
  }
}

/**
 * Ejecuta una query que devuelve una sola fila
 */
async function queryOne(db, pool, sql, params = []) {
  if (isProduction) {
    const result = await pool.query(sql, params);
    return result.rows[0] || null;
  } else {
    const stmt = db.prepare(sql);
    return params.length ? stmt.get(...params) : stmt.get();
  }
}

/**
 * Ejecuta comandos SQL directos (para inicialización)
 */
async function exec(db, pool, sql) {
  if (isProduction) {
    await pool.query(sql);
  } else {
    db.exec(sql);
  }
}

/**
 * Convierte queries de SQLite a PostgreSQL
 * - strftime('%s', 'now') → EXTRACT(EPOCH FROM NOW())::INTEGER
 * - INTEGER PRIMARY KEY → SERIAL PRIMARY KEY
 * - ON CONFLICT → ON CONFLICT
 */
function convertSQL(sql) {
  if (!isProduction) return sql;
  
  return sql
    .replace(/strftime\('%s', 'now'\)/g, "EXTRACT(EPOCH FROM NOW())::INTEGER")
    .replace(/INTEGER NOT NULL DEFAULT \(strftime\('%s', 'now'\)\)/g, "INTEGER NOT NULL DEFAULT EXTRACT(EPOCH FROM NOW())::INTEGER")
    .replace(/\bINTEGER\b(?! NOT NULL DEFAULT| NOT NULL| DEFAULT)/g, "BIGINT")
    .replace(/\bREAL\b/g, "NUMERIC");
}

module.exports = {
  query,
  queryOne,
  exec,
  convertSQL,
  isProduction
};
