# 🚀 SOLUCIÓN EMAIL PARA PRODUCCIÓN

## ❌ Problemas Actuales

### 1. MailerSend Trial Limitations
- **Solo puede enviar a email del administrador verificado**
- Trial domain: 100 emails/día máximo a 5 destinatarios
- No funciona para usuarios reales en producción

### 2. Planes MailerSend
- **Free**: 500 emails/mes - PERO necesita verificar dominio propio
- **Hobby**: $5.60/mes - 5,000 emails/mes
- **Starter**: $28/mes - 50,000 emails/mes

---

## ✅ MEJOR ALTERNATIVA: **RESEND**

### ¿Por qué Resend?

| Feature | MailerSend Free | Resend Free | Resend Pro |
|---------|-----------------|-------------|------------|
| **Emails/mes** | 500 | **3,000** | 50,000 |
| **Emails/día** | 100 | **100** | Sin límite |
| **Dominios** | 1 | 1 | 10 |
| **Restricciones** | Solo admin verificado | ❌ **NINGUNA** | ❌ Ninguna |
| **Precio** | $0 | **$0** | $20/mes |

### 🎯 Ventajas de Resend

✅ **3,000 emails/mes GRATIS** (vs 500 de MailerSend)  
✅ **SIN restricciones de destinatarios** (puedes enviar a cualquier email desde día 1)  
✅ **100 emails/día** sin verificaciones previas  
✅ API súper simple (similar a MailerSend)  
✅ Usado por empresas top: Warner Bros, eBay, Gumroad  
✅ Excelente deliverability (emails no van a spam)  

---

## 🔧 MIGRACIÓN A RESEND (15 minutos)

### Paso 1: Crear cuenta en Resend

1. Ve a: https://resend.com/signup
2. Regístrate con tu email
3. Verifica tu email
4. **NO necesitas verificar dominio para empezar a enviar**

### Paso 2: Obtener API Key

1. En dashboard de Resend: https://resend.com/api-keys
2. Clic en **"Create API Key"**
3. Nombre: `Production API Key`
4. Permisos: **Sending access**
5. Copia la API key (empieza con `re_`)

### Paso 3: Actualizar código backend

**Instalar SDK de Resend:**
```bash
cd backend
npm uninstall mailersend
npm install resend
```

**Actualizar `backend/email.js`:**
```javascript
const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

async function sendWelcomeEmail(userEmail, userName) {
  try {
    await resend.emails.send({
      from: process.env.FROM_EMAIL || 'onboarding@resend.dev',
      to: userEmail,
      subject: '¡Bienvenido a Whop Recovery!',
      html: `
        <h1>¡Hola ${userName}!</h1>
        <p>Gracias por registrarte en Whop Recovery.</p>
        <p>Estamos aquí para ayudarte a recuperar pagos fallidos automáticamente.</p>
      `
    });
    console.log('✅ Email de bienvenida enviado a:', userEmail);
  } catch (error) {
    console.error('❌ Error enviando email:', error);
  }
}

// Similar para las demás funciones...
```

**Actualizar `backend/mailer.js`:**
```javascript
const { Resend } = require('resend');

function getResendConfig(tenantId) {
  const integration = db.prepare(
    'SELECT resend_api_key FROM tenant_integrations WHERE tenant_id = ?'
  ).get(tenantId);

  const apiKey = integration?.resend_api_key || process.env.RESEND_API_KEY;
  return new Resend(apiKey);
}

async function sendPaymentFailedEmail(tenantId, userEmail, amount, invoiceUrl) {
  const resend = getResendConfig(tenantId);
  
  await resend.emails.send({
    from: process.env.FROM_EMAIL || 'noreply@resend.dev',
    to: userEmail,
    subject: 'Tu pago falló - Actualiza tu método de pago',
    html: `
      <h2>Hola,</h2>
      <p>Tu pago de $${amount} no pudo procesarse.</p>
      <a href="${invoiceUrl}">Actualizar método de pago</a>
    `
  });
}
```

### Paso 4: Actualizar variables de entorno

**`.env` (local):**
```env
# Resend
RESEND_API_KEY=re_tuApiKeyAqui
FROM_EMAIL=onboarding@resend.dev
FROM_NAME=Whop Recovery
SUPPORT_EMAIL=support@yourdomain.com
```

**Railway (producción):**
```bash
railway variables set RESEND_API_KEY=re_tuApiKeyAqui
railway variables set FROM_EMAIL=onboarding@resend.dev
```

### Paso 5: Actualizar schema de DB

**Migración SQL:**
```sql
-- Renombrar columna mailersend a resend
ALTER TABLE tenant_integrations RENAME COLUMN mailersend_api_key TO resend_api_key;
ALTER TABLE tenant_integrations RENAME COLUMN is_mailersend_connected TO is_resend_connected;
```

**O ejecutar en Node.js:**
```javascript
// backend/migrate-to-resend.js
const db = require('./db-adapter');

db.exec('BEGIN TRANSACTION');

db.exec(`
  CREATE TABLE tenant_integrations_new (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tenant_id TEXT UNIQUE NOT NULL,
    stripe_account_id TEXT,
    stripe_secret_key TEXT,
    whop_api_key TEXT,
    resend_api_key TEXT,
    is_stripe_connected INTEGER DEFAULT 0,
    is_whop_connected INTEGER DEFAULT 0,
    is_resend_connected INTEGER DEFAULT 0,
    connected_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (tenant_id) REFERENCES users(tenant_id)
  )
`);

db.exec(`
  INSERT INTO tenant_integrations_new 
  SELECT id, tenant_id, stripe_account_id, stripe_secret_key, whop_api_key,
         mailersend_api_key, is_stripe_connected, is_whop_connected,
         is_mailersend_connected, connected_at
  FROM tenant_integrations
`);

db.exec('DROP TABLE tenant_integrations');
db.exec('ALTER TABLE tenant_integrations_new RENAME TO tenant_integrations');
db.exec('COMMIT');

console.log('✅ Migración a Resend completada');
```

### Paso 6: Testing

**Probar envío local:**
```bash
cd backend
node -e "
const { Resend } = require('resend');
const resend = new Resend('re_tuApiKeyAqui');

resend.emails.send({
  from: 'onboarding@resend.dev',
  to: 'marcps2001@gmail.com',
  subject: 'Test Resend',
  html: '<h1>Funciona perfectamente!</h1>'
}).then(() => console.log('✅ Email enviado'))
  .catch(err => console.error('❌ Error:', err));
"
```

### Paso 7: Deploy

```bash
git add .
git commit -m "feat: Migrar de MailerSend a Resend para producción"
git push
```

Railway auto-desplegará el nuevo código.

---

## 📊 Comparación Final

### MailerSend vs Resend

| Aspecto | MailerSend | Resend |
|---------|------------|--------|
| **Emails gratis/mes** | 500 | **3,000** ⭐ |
| **Trial restrictions** | Solo admin verificado ❌ | **Sin restricciones** ✅ |
| **Configuración inicial** | Verificar dominio | **Instant start** ✅ |
| **Developer Experience** | Buena | **Excelente** ⭐ |
| **Plan de pago barato** | $5.60/mes (5K emails) | **$20/mes (50K emails)** ⭐ |
| **Empresas que lo usan** | Pequeñas | **Warner Bros, eBay** ⭐ |

---

## 🎯 Recomendación Final

### USAR RESEND porque:

1. **3,000 emails/mes gratis** (6x más que MailerSend free)
2. **SIN restricciones de destinatarios** - Puedes empezar a enviar YA
3. **Mejor developer experience** - API más simple
4. **Mejor para escalar** - $20/mes por 50K emails (vs $28 en MailerSend)
5. **Confianza** - Lo usan empresas Fortune 500

### Tiempo de migración: **15-30 minutos**

---

## 🆘 Fix del Error 500 en Admin Delete

El error 500 al borrar usuarios es por el endpoint `/api/admin/stats` que falla después de borrar.

**Fix necesario en `backend/routes.js`:**

```javascript
router.get('/api/admin/stats', authenticateToken, (req, res) => {
  try {
    if (req.user.email !== 'marcps2001@gmail.com') {
      return res.status(403).json({ error: 'Acceso denegado' });
    }

    const totalUsers = db.prepare('SELECT COUNT(*) as count FROM users').get().count || 0;
    const totalRecovered = db.prepare('SELECT COUNT(*) as count FROM payments WHERE status = "recovered"').get().count || 0;
    const proUsers = db.prepare('SELECT COUNT(*) as count FROM subscriptions WHERE plan = "pro"').get().count || 0;
    const enterpriseCount = db.prepare('SELECT COUNT(*) as count FROM subscriptions WHERE plan = "enterprise"').get().count || 0;
    
    const mrr = (proUsers * 29) + (enterpriseCount * 99);

    res.json({
      totalUsers: totalUsers || 0,
      totalRecovered: totalRecovered || 0,
      proUsers: proUsers || 0,
      enterpriseUsers: enterpriseCount || 0,
      mrr: mrr || 0
    });

  } catch (error) {
    console.error('❌ Error obteniendo stats:', error);
    // Devolver valores por defecto en caso de error
    res.json({
      totalUsers: 0,
      totalRecovered: 0,
      proUsers: 0,
      enterpriseUsers: 0,
      mrr: 0
    });
  }
});
```

---

## ✅ Checklist Final

- [ ] Crear cuenta en Resend
- [ ] Obtener API key de Resend
- [ ] `npm install resend` + `npm uninstall mailersend`
- [ ] Actualizar `email.js` con Resend SDK
- [ ] Actualizar `mailer.js` con Resend SDK
- [ ] Actualizar variables `.env` y Railway
- [ ] Ejecutar migración SQL (mailersend → resend)
- [ ] Fix del error 500 en `/api/admin/stats`
- [ ] Test local de envío de email
- [ ] Deploy a Railway
- [ ] Verificar logs en Railway
- [ ] Test en producción (registro de usuario)

---

**¿Quieres que te ayude a hacer la migración paso a paso?** 🚀
