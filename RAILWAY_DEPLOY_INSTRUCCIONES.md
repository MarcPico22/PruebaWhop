# 🚀 INSTRUCCIONES PARA DESPLEGAR EN RAILWAY

## ❌ Problema Actual

Railway no tiene las tablas/columnas necesarias para FASE 2:
- ❌ `users.onboarding_step` (columna faltante)
- ❌ `users.onboarding_completed_at` (columna faltante)
- ❌ `achievements` (tabla completa faltante)

Esto causa errores:
```
SqliteError: no such column: onboarding_step
SqliteError: no such table: achievements
```

## ✅ SOLUCIÓN: Ejecutar Migraciones en Railway

### Opción 1: Ejecutar via CLI de Railway

```bash
# 1. Instalar Railway CLI
npm install -g @railway/cli

# 2. Login
railway login

# 3. Conectar al proyecto
railway link

# 4. Ejecutar migraciones
railway run node migrations.js
```

### Opción 2: Ejecutar SQL Manualmente en Railway Dashboard

1. Ve a Railway Dashboard → Tu proyecto
2. Abre la pestaña **Variables**
3. Busca la variable `DATABASE_URL` (si existe) o el path del archivo SQLite
4. Abre **Terminal** en Railway
5. Ejecuta:

```bash
cd /app
node migrations.js
```

### Opción 3: SQL Directo (si Railway tiene SQLite Browser)

Copia y pega el contenido de `backend/railway_migrations.sql`:

```sql
-- Add onboarding columns
ALTER TABLE users ADD COLUMN onboarding_step INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN onboarding_completed_at INTEGER;

-- Create achievements table
CREATE TABLE IF NOT EXISTS achievements (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  tenant_id TEXT NOT NULL,
  badge_type TEXT NOT NULL,
  unlocked_at INTEGER NOT NULL,
  metadata TEXT,
  UNIQUE(user_id, badge_type)
);

-- Create indices
CREATE INDEX IF NOT EXISTS idx_achievements_user_id ON achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_achievements_tenant_id ON achievements(tenant_id);
CREATE INDEX IF NOT EXISTS idx_users_onboarding_step ON users(onboarding_step);
```

### Opción 4: Forzar Re-Deploy (ejecutará migrations.js automáticamente)

Si añadiste `migrations.js` al script de inicio:

```json
// package.json
{
  "scripts": {
    "start": "node migrations.js && node server.js"
  }
}
```

Entonces solo necesitas:
```bash
git push origin main
```

Railway redesplegará automáticamente y ejecutará las migraciones.

---

## 📧 SendGrid Error: 403 Forbidden

El error de SendGrid:
```
ResponseError: Forbidden (code: 403)
```

### Causas posibles:

1. **API Key inválida o expirada**
   - Ve a SendGrid Dashboard → Settings → API Keys
   - Crea una nueva API key con permisos de "Mail Send"
   - Actualiza en Railway: `SENDGRID_API_KEY=SG.xxxxx`

2. **Sender no verificado**
   - Ve a SendGrid → Settings → Sender Authentication
   - Verifica tu dominio O verifica un email individual
   - Asegúrate que `FROM_EMAIL` en Railway coincide con el sender verificado

3. **Cuenta SendGrid suspendida**
   - Revisa tu email de SendGrid
   - Puede estar en "free tier limit" (100 emails/día)
   - Upgrade a plan de pago si necesitas más

### ✅ Solución:

```bash
# En Railway Dashboard → Variables:

SENDGRID_API_KEY=SG.TU_NUEVA_API_KEY_AQUI
FROM_EMAIL=tu-email-verificado@tudominio.com
FROM_NAME=Whop Recovery
```

Después de actualizar, reinicia el servicio en Railway.

---

## 🌐 Testing Local → Producción

### Local (funcionando):
```
Frontend: http://localhost:5173
Backend: http://localhost:3000
Database: ./data.db (con migraciones aplicadas ✅)
```

### Producción Railway:
```
Frontend: https://tu-frontend.vercel.app
Backend: https://tu-backend.railway.app
Database: Railway SQLite (SIN migraciones ❌)
```

### ✅ Checklist para Railway:

- [ ] Ejecutar `node migrations.js` en Railway
- [ ] Verificar columnas con SQL: `PRAGMA table_info(users);`
- [ ] Verificar tabla achievements: `SELECT * FROM achievements LIMIT 1;`
- [ ] Actualizar SENDGRID_API_KEY con key válida
- [ ] Verificar sender en SendGrid Dashboard
- [ ] Test endpoint: `curl https://tu-backend.railway.app/api/user/onboarding -H "Authorization: Bearer TOKEN"`

---

## 📝 Comandos Útiles en Railway

```bash
# Ver logs en tiempo real
railway logs

# Ejecutar comando en Railway
railway run [comando]

# Abrir shell en Railway
railway shell

# Ver variables de entorno
railway variables

# Redeploy manual
railway up
```

---

## 🔗 Links Importantes

- Railway Dashboard: https://railway.app/dashboard
- SendGrid Dashboard: https://app.sendgrid.com
- Vercel Dashboard: https://vercel.com/dashboard

---

## 🆘 Si Nada Funciona

1. **Backup local**: Tu DB local (`./data.db`) tiene todo funcionando
2. **Recrear DB en Railway**:
   - Descarga `data.db` local
   - Súbela a Railway via SFTP o volume
   - Apunta `DATABASE_URL` al nuevo archivo

3. **Alternativamente**: Cambia a PostgreSQL en Railway (más estable para producción)
   ```bash
   railway add
   # Selecciona: PostgreSQL
   ```
   Luego migra tu schema de SQLite → PostgreSQL.

---

✅ Una vez ejecutadas las migraciones, todos los errores deberían desaparecer.
