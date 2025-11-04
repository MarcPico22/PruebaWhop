# ⚠️ MAILERSEND TRIAL - IMPORTANTE

## Problema Actual

```
message: "Trial accounts can only send emails to the administrator's email. #MS42225"
```

## ¿Qué significa?

Las **cuentas trial de MailerSend** solo pueden enviar emails a:
- El email del administrador que creó la cuenta
- Emails verificados explícitamente

## Solución

### Opción 1: Verificar email de administrador (RECOMENDADO)

1. Ve a MailerSend Dashboard: https://app.mailersend.com
2. Navega a **Settings → Verified Senders**
3. Verifica que tu email de administrador esté verificado
4. **Actualiza `FROM_EMAIL` en `.env`** con ese email verificado

**Actualizar `.env`**:
```env
# Usa el email del administrador verificado en MailerSend
FROM_EMAIL=tu-email-verificado@example.com
SUPPORT_EMAIL=tu-email-verificado@example.com
```

### Opción 2: Agregar emails de prueba permitidos

1. Ve a MailerSend Dashboard
2. **Settings → Email Verification**
3. Agrega los emails a los que quieres enviar durante testing
4. Verifica cada email (recibirán un link de confirmación)

### Opción 3: Actualizar plan (PARA PRODUCCIÓN)

Para enviar a cualquier email:
1. Ve a **Billing** en MailerSend
2. Upgrade a plan de pago (desde $1/mes para 12k emails)
3. Una vez actualizado, podrás enviar a cualquier email

---

## Testing Local

Para probar emails **sin enviar realmente**, el código ya tiene un fallback:

Si no hay `MAILERSEND_API_KEY` configurada, los emails se **loguean en consola**:
```
📧 EMAIL (simulado, no hay MailerSend configurado):
   Para: 1234@gmail.com
   Asunto: Bienvenido
   ...
```

**Para activar modo simulado localmente**:
```env
# Comenta temporalmente en .env:
# MAILERSEND_API_KEY=mlsn.xxx
```

---

## Recomendación

**Para desarrollo local**: Usa modo simulado (sin API key)
**Para testing real**: Verifica tu email de admin en MailerSend
**Para producción**: Upgrade a plan de pago

---

## Estado Actual

- ✅ Código migrado a MailerSend
- ✅ API Key configurada
- ⚠️ Trial account - Solo puedes enviar a email verificado
- ⏳ Acción requerida: Verificar email de admin en MailerSend

---

**Ver más**: https://developers.mailersend.com/general.html#email-verification
