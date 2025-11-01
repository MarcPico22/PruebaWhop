# 📧 SendGrid Setup - Solución al Error 403 Forbidden

## ❌ Problema Actual:
```
code: 403,
ResponseError: Forbidden
```

Esto significa que SendGrid **bloqueó el envío** porque el remitente no está verificado.

## ✅ Solución:

### Opción 1: Verificar Email Individual (Rápido - 5 minutos)

1. **Ve a SendGrid**: https://app.sendgrid.com/settings/sender_auth/senders
2. Click **"Create New Sender"**
3. Completa el formulario:
   - **From Name**: `Whop Recovery`
   - **From Email**: `marcp2001@gmail.com` (o el email que uses)
   - **Reply To**: `marcp2001@gmail.com`
   - **Company**: `Whop Recovery`
   - **Address**: Tu dirección
4. **Submit**
5. **Revisa tu email** (marcp2001@gmail.com)
6. **Click en el link de verificación**
7. ✅ Listo - Los emails empezarán a funcionar

### Opción 2: Verificar Dominio (Profesional - 1 hora)

Para usar `noreply@whoprecovery.com`:

1. **Ve a**: https://app.sendgrid.com/settings/sender_auth
2. Click **"Verify a Single Sender"** → **"Domain Authentication"**
3. Selecciona **Cloudflare** (o tu DNS provider)
4. Añade los registros DNS que te dé SendGrid:
   ```
   Tipo: CNAME
   Nombre: em1234.whoprecovery.com
   Valor: u1234.wl123.sendgrid.net
   
   Tipo: CNAME
   Nombre: s1._domainkey.whoprecovery.com
   Valor: s1.domainkey.u1234.wl123.sendgrid.net
   
   Tipo: CNAME  
   Nombre: s2._domainkey.whoprecovery.com
   Valor: s2.domainkey.u1234.wl123.sendgrid.net
   ```
5. Espera 24-48h propagación DNS
6. Vuelve a SendGrid → **"Verify"**

### Variables de Entorno (Después de Verificar)

**Si verificaste marcp2001@gmail.com:**
```env
FROM_EMAIL=marcp2001@gmail.com
SUPPORT_EMAIL=marcp2001@gmail.com
SENDGRID_API_KEY=SG.xxxxxx (tu API key de SendGrid)
```

**Si verificaste dominio whoprecovery.com:**
```env
FROM_EMAIL=noreply@whoprecovery.com
SUPPORT_EMAIL=support@whoprecovery.com
SENDGRID_API_KEY=SG.xxxxxx (tu API key de SendGrid)
```

## 🧪 Test

Después de verificar, prueba:

```powershell
curl -X POST https://pruebawhop-production.up.railway.app/api/test/email/welcome `
  -H "Content-Type: application/json" `
  -d '{"email":"marcp2001@gmail.com"}'
```

Deberías recibir el email en 1-2 minutos.

## 📝 Notas:

- **Mientras tanto**: El registro funciona normalmente, solo no se envían emails
- **Los emails son opcionales**: La app funciona sin ellos
- **Recomendación**: Verifica `marcp2001@gmail.com` primero (5 min), luego dominio cuando tengas tiempo

---

**Estado actual**: ⚠️ SendGrid bloqueado, registro funciona pero sin emails
**Acción requerida**: Verificar sender en SendGrid (link arriba)
