# 💳 Stripe Payment Recovery - Setup Rápido

## 🚀 Configuración en 3 pasos

### 1️⃣ Obtener claves de Stripe (5 minutos)

1. **Crear cuenta**: [stripe.com](https://stripe.com) → Sign Up
2. **Modo Test**: Activar "Test mode" (toggle arriba derecha)
3. **API Keys**: Dashboard → Developers → API Keys
   - Copiar `sk_test_...` (Secret key)

### 2️⃣ Configurar backend

Editar `backend/.env`:

```env
# Stripe (modo TEST)
STRIPE_SECRET_KEY=sk_test_tu_clave_aqui
STRIPE_WEBHOOK_SECRET=whsec_pendiente_de_configurar
```

### 3️⃣ Probar localmente

#### Terminal 1 - Backend:
```bash
cd backend
npm install
node server.js
```

#### Terminal 2 - Frontend:
```bash
cd frontend
npm install
npm run dev
```

#### Terminal 3 - Stripe CLI (webhooks):
```bash
# Instalar Stripe CLI (solo primera vez)
# Windows: scoop install stripe
# Mac: brew install stripe/stripe-cli/stripe

stripe login
stripe listen --forward-to localhost:3000/webhook/stripe

# Copiar el whsec_... que muestre al .env
```

---

## 🧪 Testing

1. **Login**: `http://localhost:5173/login`
2. **Crear pago de prueba**: Click en "Crear pago de prueba"
3. **Pagar con Stripe**:
   - Click en botón "💳 Stripe"
   - Tarjeta: `4242 4242 4242 4242`
   - Expiración: `12/25`
   - CVC: `123`
   - ZIP: `10001`

4. **Verificar**:
   - Ver webhook recibido en Terminal 3
   - Pago cambia a "✅ Recuperado" en Dashboard

---

## 📝 Arquitectura

```
Frontend (React + Vite)
    ↓ POST /api/stripe/create-checkout-session
Backend (Node + Express)
    ↓ stripe.checkout.sessions.create()
Stripe Checkout (hosted)
    ↓ webhook: checkout.session.completed
Backend actualiza DB
    ↓
Dashboard actualizado ✅
```

---

## 🔑 Features Implementadas

- ✅ **Autenticación JWT** - Login/Signup seguro
- ✅ **Multi-tenancy** - Aislamiento por empresa
- ✅ **Dark Mode** - Toggle persistente
- ✅ **Stripe Checkout** - Pagos reales seguros
- ✅ **Webhooks** - Verificación de firma
- ✅ **Test Payments** - Crear pagos de prueba
- ✅ **Dashboard** - Stats + tabla responsive
- ✅ **Notificaciones Email** - Alertas automáticas configurables

---

## 📚 Documentación Completa

- **Authentication**: `MEJORAS_v2.0.md`
- **Multi-tenancy**: `MULTI-TENANCY_v2.1.md`
- **Stripe**: `STRIPE_v2.2.md`
- **Notificaciones**: `NOTIFICACIONES_v2.3.md`
- **Stripe**: `STRIPE_v2.2.md`

---

## 🆘 Troubleshooting

### Backend no inicia
```bash
# Verificar puerto 3000 libre
netstat -ano | findstr :3000
# Si está ocupado: taskkill /F /PID <numero>
```

### Webhook no funciona
```bash
# Verificar Stripe CLI activo
stripe listen --forward-to localhost:3000/webhook/stripe

# Probar manualmente
stripe trigger checkout.session.completed
```

### Frontend no conecta
- Verificar que backend esté en puerto 3000
- Confirmar `API_URL = 'http://localhost:3000'` en archivos

---

## 🌐 Producción

1. **Stripe Live Keys**:
   - Desactivar "Test mode" en Stripe
   - Copiar claves `sk_live_...`

2. **Webhook Production**:
   - Stripe Dashboard → Webhooks → Add endpoint
   - URL: `https://tu-dominio.com/webhook/stripe`
   - Eventos: `checkout.session.completed`

3. **Env Variables**:
   ```env
   STRIPE_SECRET_KEY=sk_live_...
   STRIPE_WEBHOOK_SECRET=whsec_...
   BASE_URL=https://tu-dominio.com
   ```

---

## 📦 Stack

**Backend**:
- Node.js + Express
- SQLite (database)
- JWT (auth)
- Stripe SDK
- Bcrypt (passwords)

**Frontend**:
- React 18
- Vite
- TailwindCSS
- React Router v7

---

## 🎯 Roadmap Completado

- ✅ v1.0 - MVP básico
- ✅ v1.1 - UI mejorada
- ✅ v2.0 - Authentication + Dark Mode
- ✅ v2.1 - Multi-tenancy
- ✅ v2.2 - Stripe Integration
- ✅ v2.3 - Sistema de Notificaciones

**Próximo**: PWA + Push Notifications 🔔

---

*¿Preguntas? Revisa la documentación completa en los archivos `.md`*
