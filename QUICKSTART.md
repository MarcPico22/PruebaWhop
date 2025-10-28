# 🚀 GUÍA RÁPIDA - Whop Retry MVP

## ⚡ Inicio Ultra-Rápido (3 pasos)

### 1️⃣ Instalar Backend
```powershell
cd backend
npm install
```

### 2️⃣ Instalar Frontend
```powershell
cd ..\frontend
npm install
```

### 3️⃣ Ejecutar Todo

**Terminal 1 - Backend:**
```powershell
cd backend
npm run dev
```

**Terminal 2 - Frontend:**
```powershell
cd frontend
npm run dev
```

## 🎯 Accesos Rápidos

- **Dashboard**: http://localhost:5173
- **API Backend**: http://localhost:3000
- **Health Check**: http://localhost:3000/health

## 🧪 Primera Prueba (30 segundos)

1. Abre http://localhost:5173
2. Click en **"+ Crear pago de prueba"**
3. Observa el pago aparecer en la tabla
4. En 1 minuto verás el primer reintento automático
5. Puedes forzar un reintento con el botón **"🔄 Retry"**

## 📊 Lo Que Verás

### Dashboard
```
💳 Whop Retry
────────────────────────────────────────
┌─────────┬──────────┬──────────┬───────┬──────────┐
│ Total   │ Pending  │ Recov.   │ Failed│ $ Recov. │
│   5     │    2     │    2     │   1   │  $129.97 │
└─────────┴──────────┴──────────┴───────┴──────────┘

[Todos] [Pendientes] [Recuperados] [Fallidos]

Email           Producto        Monto   Estado      Intentos  Acción
──────────────────────────────────────────────────────────────────
test@ej.com     Curso X         $29.99  ⏳ Pending  1/3       [🔄 Retry]
user@ej.com     Membresía       $49.99  ✅ Recov.   2/3       ✅ Completado
```

## 🔄 Flujo Completo

```
1. Webhook → Pago registrado
            ↓
2. Email enviado (o log en consola)
            ↓
3. Aparece en Dashboard como "Pendiente"
            ↓
4. Reintento automático en 1 min
            ↓
5. Si falla → reintento en 5 min
            ↓
6. Si falla → reintento en 15 min
            ↓
7. Si falla → marca como "Fallo permanente"
            ↓
8. Si éxito → marca como "Recuperado" ✅
```

## 📧 Emails (sin SendGrid configurado)

Sin API key de SendGrid, verás esto en la consola del backend:

```
📧 EMAIL (simulado, no hay SendGrid API key):
   Para: test@ejemplo.com
   Asunto: Tu pago para Curso X falló — reintenta aquí
   Contenido:
   [HTML del email]
```

## 🎨 Estados Visuales

- 🟡 **Pendiente**: Amarillo - esperando reintento
- 🟢 **Recuperado**: Verde - pago exitoso
- 🔴 **Fallido**: Rojo - fallo permanente (3 intentos)

## 🛠️ Solución de Problemas Comunes

### ❌ Error "npm: command not found"
→ Instala Node.js desde https://nodejs.org

### ❌ Puerto 3000 en uso
→ Cambia `PORT=3001` en `backend/.env`

### ❌ Frontend no conecta
→ Verifica que backend esté corriendo (http://localhost:3000/health)

### ❌ "Cannot find module..."
→ Ejecuta `npm install` en la carpeta correspondiente

## 🔥 Comandos Útiles

### Crear pago de prueba (sin abrir dashboard)
```powershell
curl -X POST http://localhost:3000/seed-test-payment
```

### Simular webhook de Whop
```powershell
curl -X POST http://localhost:3000/webhook/whop -H "Content-Type: application/json" -d '{\"event\":\"payment_failed\",\"data\":{\"id\":\"pay_999\",\"email\":\"nuevo@test.com\",\"product\":\"Producto Test\",\"amount\":99.99}}'
```

### Ver todos los pagos (JSON)
```powershell
curl http://localhost:3000/api/payments
```

### Seed múltiples pagos
```powershell
cd backend
npm run seed
```

## 📱 Página Pública de Reintento

Cuando un cliente recibe el email, hace click en el link y ve:

```
┌────────────────────────────────┐
│  💳 Reintentar pago            │
│                                │
│  Curso Avanzado de JavaScript  │
│  $99.99                        │
│                                │
│  ⏳ Pendiente                  │
│                                │
│  Para: cliente@ejemplo.com     │
│  Intentos: 1/3                 │
│                                │
│  [🔄 Reintentar pago ahora]    │
│                                │
└────────────────────────────────┘
```

## 💡 Tips

- El dashboard se auto-actualiza cada 10 segundos
- Los reintentos tienen 30% de probabilidad de éxito (simulado)
- Puedes tener múltiples pestañas del dashboard abiertas
- El scheduler revisa pagos pendientes cada 30 segundos
- Los links de reintento nunca expiran (mientras exista el pago)

## 🎓 Siguiente Nivel

### Configurar SendGrid (emails reales)

1. Crea cuenta gratis en https://sendgrid.com
2. Ve a Settings → API Keys → Create API Key
3. Edita `backend/.env`:
   ```env
   SENDGRID_API_KEY=SG.tu_api_key_aqui
   FROM_EMAIL=no-reply@tudominio.com
   ```
4. Reinicia el backend

### Ajustar intervalos (para demo más rápida)
Edita `backend/.env`:
```env
RETRY_INTERVALS=10,30,60    # 10s, 30s, 60s para demos
```

### Cambiar probabilidad de éxito
Edita `backend/retry-logic.js` línea 10:
```javascript
const success = Math.random() < 0.7; // 70% éxito
```

---

## ✅ Checklist de Funcionalidades

- [x] Webhook recibe pagos fallidos
- [x] SQLite almacena datos
- [x] Emails enviados (o simulados)
- [x] Dashboard con estadísticas
- [x] Filtros por estado
- [x] Reintentos automáticos programados
- [x] Reintentos manuales desde UI
- [x] Página pública para clientes
- [x] Estados con código de colores
- [x] Auto-refresh del dashboard
- [x] Simulación de cobros (30% éxito)
- [x] Seed de datos de prueba

---

**¡Todo listo!** 🎉

Ahora ejecuta los comandos del paso 3 y empieza a probar.
