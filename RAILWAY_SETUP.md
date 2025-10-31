# 🚂 Railway Setup - Base de Datos Persistente

## ⚠️ IMPORTANTE: Configurar Volumen Persistente

Tu base de datos SQLite está desapareciendo porque Railway reinicia contenedores.

### Pasos para arreglar:

1. **Ve a Railway Dashboard**: https://railway.app
2. **Selecciona tu proyecto**: `pruebawhop-production`
3. Click en tu **servicio backend**
4. Ve a **"Settings"** (⚙️)
5. Scroll hasta **"Volumes"**
6. Click **"+ New Volume"**
7. Configura:
   - **Mount Path**: `/data`
   - **Size**: 1 GB (suficiente para SQLite)
8. **Save** y espera a que redeploy

### ✅ Verificación

Después del redeploy, ejecuta:

```powershell
curl https://pruebawhop-production.up.railway.app/api/debug/users
```

Si el volumen está configurado, ahora los usuarios persistirán entre deploys.

### 📝 Variables de entorno recomendadas

Asegúrate de tener en Railway:

```
DATABASE_URL=/data/database.sqlite
RAILWAY_ENVIRONMENT=production
JWT_SECRET=tu-secreto-super-seguro-cambiame-en-produccion
BASE_URL=https://pruebawhop-production.up.railway.app
```

### 🔍 Debug

Si sigues teniendo problemas:

1. Ve a Railway → Logs
2. Busca: `✅ Base de datos conectada:`
3. Debe decir: `/data/database.sqlite`
4. Si dice `./data.db` → el volumen NO está configurado

---

**Después de configurar el volumen, deberás REGISTRARTE DE NUEVO** porque la BD anterior (sin volumen) se perdió.
