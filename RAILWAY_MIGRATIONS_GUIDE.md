# 🚀 INSTRUCCIONES DE MIGRACIÓN - Railway Production Database

## 📋 Contexto
Se necesitan ejecutar **2 migraciones SQL** en la base de datos de producción (Railway) para resolver errores críticos.

---

## ❌ Errores Actuales en Producción

### Error 1: `no such column: u.onboarding_step`
```
SqliteError: no such column: u.onboarding_step
    at Database.prepare (/app/node_modules/better-sqlite3/lib/methods/wrappers.js:5:21)
    at /app/routes.js:1569:22
```

### Error 2: `no such table: achievements`
```
SqliteError: no such table: achievements
```

**Solución temporal aplicada:** Fallbacks en código (commit b386971)  
**Solución definitiva:** Ejecutar migraciones SQL

---

## 🔧 MIGRACIONES A EJECUTAR

### Migración 1: Agregar columnas de onboarding
**Archivo:** `backend/migrations/add_onboarding_columns.sql`

```sql
-- Add onboarding_step column (default 0)
ALTER TABLE users ADD COLUMN onboarding_step INTEGER DEFAULT 0;

-- Add onboarding_completed_at column (nullable timestamp)
ALTER TABLE users ADD COLUMN onboarding_completed_at INTEGER;

-- Update existing users to have onboarding_step = 0
UPDATE users SET onboarding_step = 0 WHERE onboarding_step IS NULL;
```

**Impacto:** Permite rastrear el progreso del onboarding de usuarios  
**Tiempo estimado:** 5 segundos

---

### Migración 2: Crear tabla de achievements
**Archivo:** `backend/fix_achievements.sql`

```sql
CREATE TABLE IF NOT EXISTS achievements (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  badge_type TEXT NOT NULL,
  unlocked_at INTEGER NOT NULL,
  UNIQUE(user_id, badge_type),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Index para queries rápidas
CREATE INDEX IF NOT EXISTS idx_achievements_user ON achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_achievements_badge ON achievements(badge_type);
```

**Impacto:** Habilita sistema de gamificación (badges)  
**Tiempo estimado:** 5 segundos

---

## 📝 PASOS PARA EJECUTAR EN RAILWAY

### Opción A: Railway CLI (Recomendado)

```bash
# 1. Instalar Railway CLI (si no está instalado)
npm install -g @railway/cli

# 2. Login a Railway
railway login

# 3. Conectar al proyecto
railway link

# 4. Ejecutar migrations
railway run sqlite3 /data/database.sqlite < backend/migrations/add_onboarding_columns.sql
railway run sqlite3 /data/database.sqlite < backend/fix_achievements.sql

# 5. Verificar que se crearon correctamente
railway run sqlite3 /data/database.sqlite "PRAGMA table_info(users);"
railway run sqlite3 /data/database.sqlite "SELECT name FROM sqlite_master WHERE type='table';"
```

---

### Opción B: Railway Dashboard (Web Console)

1. **Ir a Railway Dashboard**
   - https://railway.app/
   - Seleccionar proyecto: `PruebaWhop`

2. **Abrir Terminal del servicio backend**
   - Click en el servicio `backend`
   - Tab "Settings" → "Service Variables"
   - Tab "Deployments" → Último deployment → "View Logs"
   - Buscar botón "Terminal" o "Shell"

3. **Ejecutar comandos en terminal:**

```bash
# Verificar ruta de la base de datos
ls -la /data/

# Opción 1: Ejecutar directamente
sqlite3 /data/database.sqlite "ALTER TABLE users ADD COLUMN onboarding_step INTEGER DEFAULT 0;"
sqlite3 /data/database.sqlite "ALTER TABLE users ADD COLUMN onboarding_completed_at INTEGER;"
sqlite3 /data/database.sqlite "UPDATE users SET onboarding_step = 0 WHERE onboarding_step IS NULL;"

# Opción 2: Copiar archivo SQL y ejecutar
cat > /tmp/add_onboarding.sql << 'EOF'
ALTER TABLE users ADD COLUMN onboarding_step INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN onboarding_completed_at INTEGER;
UPDATE users SET onboarding_step = 0 WHERE onboarding_step IS NULL;
EOF

sqlite3 /data/database.sqlite < /tmp/add_onboarding.sql

# Achievements table
cat > /tmp/achievements.sql << 'EOF'
CREATE TABLE IF NOT EXISTS achievements (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  badge_type TEXT NOT NULL,
  unlocked_at INTEGER NOT NULL,
  UNIQUE(user_id, badge_type),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_achievements_user ON achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_achievements_badge ON achievements(badge_type);
EOF

sqlite3 /data/database.sqlite < /tmp/achievements.sql
```

4. **Verificar que se aplicaron correctamente:**

```bash
# Ver estructura de tabla users (debe incluir onboarding_step y onboarding_completed_at)
sqlite3 /data/database.sqlite "PRAGMA table_info(users);"

# Ver todas las tablas (debe incluir achievements)
sqlite3 /data/database.sqlite "SELECT name FROM sqlite_master WHERE type='table';"

# Verificar achievements vacía
sqlite3 /data/database.sqlite "SELECT COUNT(*) FROM achievements;"
```

---

### Opción C: Subir archivo y ejecutar (Si Railway tiene acceso a archivos)

```bash
# En Railway terminal
cd /app/backend/migrations
sqlite3 /data/database.sqlite < add_onboarding_columns.sql
cd /app/backend
sqlite3 /data/database.sqlite < fix_achievements.sql
```

---

## ✅ VERIFICACIÓN POST-MIGRACIÓN

### 1. Verificar columnas de users
```sql
PRAGMA table_info(users);
```

**Debe incluir:**
```
onboarding_step | INTEGER | 0 | 0 |
onboarding_completed_at | INTEGER | | |
```

### 2. Verificar tabla achievements
```sql
SELECT name FROM sqlite_master WHERE type='table' AND name='achievements';
```

**Debe retornar:** `achievements`

### 3. Verificar índices
```sql
SELECT name FROM sqlite_master WHERE type='index' AND tbl_name='achievements';
```

**Debe retornar:**
- `idx_achievements_user`
- `idx_achievements_badge`

### 4. Probar admin panel
- Ir a: https://your-app.railway.app/admin
- **Antes:** ❌ Error: "no such column: u.onboarding_step"
- **Después:** ✅ Lista de usuarios visible

### 5. Probar achievements
- Ir a: https://your-app.railway.app/dashboard
- **Antes:** ❌ Crashes en BadgeDisplay
- **Después:** ✅ Badges visible (todos locked)

---

## 🚨 ROLLBACK (En caso de error)

Si algo sale mal, puedes revertir:

### Eliminar columnas de onboarding:
```sql
-- SQLite no soporta DROP COLUMN directamente, necesitas recrear la tabla
-- NO EJECUTAR A MENOS QUE SEA NECESARIO
```

### Eliminar tabla achievements:
```sql
DROP TABLE IF EXISTS achievements;
DROP INDEX IF EXISTS idx_achievements_user;
DROP INDEX IF EXISTS idx_achievements_badge;
```

---

## 📊 IMPACTO ESPERADO

### ANTES de migrations:
- ❌ Admin panel crashea: "no such column: u.onboarding_step"
- ❌ Achievements crashea: "no such table: achievements"
- ⚠️ Onboarding progress no se guarda (fallback activo)

### DESPUÉS de migrations:
- ✅ Admin panel funciona correctamente
- ✅ Achievements sistema funcional
- ✅ Onboarding progress se guarda en DB
- ✅ 0 errores en Railway logs

---

## ⏱️ TIEMPO TOTAL ESTIMADO

- **Conectar a Railway:** 2 minutos
- **Ejecutar migración 1 (onboarding):** 30 segundos
- **Ejecutar migración 2 (achievements):** 30 segundos
- **Verificar todo funciona:** 2 minutos

**TOTAL:** ~5 minutos

---

## 🔗 RECURSOS

- Railway Dashboard: https://railway.app/
- Repo GitHub: https://github.com/MarcPico22/PruebaWhop
- Documentación SQLite: https://www.sqlite.org/lang_altertable.html

---

## ✨ SIGUIENTE PASO DESPUÉS DE MIGRATIONS

1. ✅ Verificar que admin panel funciona
2. ✅ Verificar que achievements no crashea
3. ✅ Testing completo en producción (30 min)
4. 🚀 **LAUNCH BETA**

---

**FIN DEL DOCUMENTO**
