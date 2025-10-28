# 📘 Guía de Configuración para Empresas

Esta guía te ayudará a configurar el sistema de recuperación de pagos en tu cuenta. **No necesitas conocimientos técnicos** - solo sigue los pasos.

---

## 🎯 ¿Qué necesito hacer?

Para que el sistema funcione, necesitas configurar **2 integraciones**:

1. **Stripe** → Para recibir pagos de tus clientes
2. **SendGrid** → Para enviar emails automáticos a tus clientes

**✅ Todo el dinero va directo a TU cuenta de Stripe** (no a la nuestra)  
**✅ Los emails se envían desde TU dominio** (ej: no-reply@tuempresa.com)  
**✅ Todas las claves se guardan encriptadas** - nadie más puede verlas

---

## 🔐 Paso 1: Configurar Stripe

### ¿Qué es Stripe?
Stripe es la plataforma que procesa los pagos con tarjeta. Tus clientes pagan con tarjeta → Stripe procesa el pago → el dinero llega a tu cuenta bancaria.

### Crear cuenta de Stripe (si no tienes una)

1. Ve a [https://dashboard.stripe.com/register](https://dashboard.stripe.com/register)
2. Regístrate con tu email empresarial
3. Completa la información de tu empresa
4. Verifica tu cuenta (te pedirán datos bancarios para recibir pagos)

### Obtener las claves de Stripe

Una vez dentro del Dashboard de Stripe:

1. **Ve a "Desarrolladores" → "Claves API"**  
   URL directa: [https://dashboard.stripe.com/apikeys](https://dashboard.stripe.com/apikeys)

2. Verás 2 claves:
   - **Clave publicable** → Empieza con `pk_test_...` o `pk_live_...`
   - **Clave secreta** → Empieza con `sk_test_...` o `sk_live_...`

3. **Haz clic en "Revelar clave de prueba"** y copia ambas claves

⚠️ **IMPORTANTE:**
- Usa `pk_test_` y `sk_test_` para hacer pruebas
- Usa `pk_live_` y `sk_live_` cuando vayas a producción
- **NUNCA compartas** tu clave secreta con nadie

### Configurar Webhooks (opcional pero recomendado)

Los webhooks permiten que Stripe nos notifique automáticamente cuando hay un pago.

1. **Ve a "Desarrolladores" → "Webhooks"**  
   URL directa: [https://dashboard.stripe.com/webhooks](https://dashboard.stripe.com/webhooks)

2. Haz clic en **"Agregar endpoint"**

3. En **"URL del endpoint"** pon:
   ```
   https://tudominio.com/api/stripe/webhook
   ```
   (Reemplaza `tudominio.com` con tu dominio real)

4. En **"Eventos a enviar"** selecciona:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `charge.failed`
   - `invoice.payment_failed`

5. Haz clic en **"Agregar endpoint"**

6. Una vez creado, verás un **"Signing secret"** que empieza con `whsec_...`  
   → Cópialo, lo necesitarás más adelante

### Pegar las claves en el sistema

1. **Inicia sesión** en tu panel de control
2. Ve a **⚙️ Configuración → 🔌 Integraciones → 💳 Stripe**
3. Pega:
   - **Secret Key** → La que empieza con `sk_test_` o `sk_live_`
   - **Publishable Key** → La que empieza con `pk_test_` o `pk_live_`
   - **Webhook Secret** → La que empieza con `whsec_` (si lo configuraste)
4. Haz clic en **"Guardar Stripe"**

✅ **¡Listo!** Stripe está configurado.

---

## 📧 Paso 2: Configurar SendGrid

### ¿Qué es SendGrid?
SendGrid es un servicio para enviar emails automáticos. Cuando un pago falla, el sistema enviará un email a tu cliente automáticamente.

### Crear cuenta de SendGrid (si no tienes una)

1. Ve a [https://signup.sendgrid.com/](https://signup.sendgrid.com/)
2. Regístrate con tu email empresarial
3. Completa la verificación (te pedirán datos de tu empresa)

SendGrid ofrece un **plan gratuito** para enviar hasta **100 emails por día**.

### Obtener la API Key de SendGrid

1. **Inicia sesión** en SendGrid
2. Ve a **"Settings" → "API Keys"**  
   URL directa: [https://app.sendgrid.com/settings/api_keys](https://app.sendgrid.com/settings/api_keys)

3. Haz clic en **"Create API Key"**

4. Configura:
   - **Nombre:** "Sistema de Recuperación de Pagos" (o el que prefieras)
   - **Permisos:** Selecciona **"Full Access"**

5. Haz clic en **"Create & View"**

6. **Copia la clave** que empieza con `SG.`

⚠️ **IMPORTANTE:**
- Solo verás esta clave **UNA VEZ** - guárdala en un lugar seguro
- Si la pierdes, tendrás que crear una nueva
- **NUNCA compartas** esta clave con nadie

### Verificar tu email remitente

SendGrid requiere que **verifiques** el email desde el cual enviarás mensajes.

#### Opción 1: Verificar un email único

1. Ve a **"Settings" → "Sender Authentication" → "Single Sender Verification"**  
   URL directa: [https://app.sendgrid.com/settings/sender_auth](https://app.sendgrid.com/settings/sender_auth)

2. Haz clic en **"Create New Sender"**

3. Completa:
   - **From Name:** Tu Empresa
   - **From Email:** no-reply@tuempresa.com
   - **Reply To:** soporte@tuempresa.com
   - **Dirección, ciudad, país:** Datos de tu empresa

4. Haz clic en **"Create"**

5. **Revisa tu email** (el que pusiste en "From Email")  
   → Recibirás un email de SendGrid para verificar

6. **Haz clic en el enlace de verificación**

✅ Una vez verificado, podrás usar ese email.

#### Opción 2: Verificar tu dominio completo (más avanzado)

Si quieres enviar desde cualquier email de tu dominio (ej: no-reply@tuempresa.com, soporte@tuempresa.com), necesitas verificar el dominio completo.

**Requisitos:** Acceso al DNS de tu dominio (GoDaddy, Namecheap, Cloudflare, etc.)

1. Ve a **"Settings" → "Sender Authentication" → "Authenticate Your Domain"**
2. Selecciona tu proveedor de DNS
3. SendGrid te dará **registros DNS** para agregar
4. Agrega esos registros en tu proveedor de dominio
5. Espera 24-48 horas para la verificación

### Pegar la API Key en el sistema

1. **Inicia sesión** en tu panel de control
2. Ve a **⚙️ Configuración → 🔌 Integraciones → 📧 SendGrid**
3. Pega:
   - **API Key** → La que empieza con `SG.`
   - **Email remitente** → El email que verificaste (ej: no-reply@tuempresa.com)
4. Haz clic en **"Guardar SendGrid"**

✅ **¡Listo!** SendGrid está configurado.

---

## 🧪 Paso 3: Probar que todo funciona

### Crear un pago de prueba

1. Ve a **💰 Pagos** en tu panel
2. Haz clic en **"Crear pago de prueba"**
3. El sistema creará un pago fallido automáticamente

### Verificar que funcionó

1. Deberías ver el pago en la lista con estado **"Pendiente"**
2. Revisa tu email - deberías recibir un email automático de "Pago fallido"
3. Si el email llegó → **¡Todo funciona!** ✅

### Probar con tarjetas de prueba de Stripe

Para simular pagos reales sin cobrar dinero:

1. Ve a tu tienda/checkout de Stripe
2. Usa estas tarjetas de prueba:

| Número de tarjeta | Resultado |
|---|---|
| `4242 4242 4242 4242` | Pago exitoso ✅ |
| `4000 0000 0000 0002` | Tarjeta rechazada ❌ |
| `4000 0000 0000 9995` | Fondos insuficientes 💰 |

- **Fecha de expiración:** Cualquier fecha futura (ej: 12/25)
- **CVC:** Cualquier 3 dígitos (ej: 123)

Más tarjetas de prueba: [https://stripe.com/docs/testing](https://stripe.com/docs/testing)

---

## ❓ Preguntas Frecuentes

### ¿Es seguro poner mis claves API aquí?

**Sí.** Todas las claves se guardan **encriptadas** en la base de datos usando AES-256 (el mismo cifrado que usan los bancos). Nadie más puede verlas, ni siquiera nosotros.

### ¿El dinero va a mi cuenta o a la vuestra?

**A TU cuenta de Stripe.** Nosotros nunca tocamos el dinero. Stripe cobra directamente a tus clientes y deposita en tu cuenta bancaria.

### ¿Cuánto cuesta Stripe?

Stripe cobra **2.9% + $0.30 por transacción exitosa**. Si el pago falla, no cobran nada.

### ¿Cuánto cuesta SendGrid?

SendGrid tiene un **plan gratuito** para hasta 100 emails/día. Si necesitas más, tienen planes desde $19.95/mes.

### ¿Qué pasa si cambio de plan de prueba (test) a producción (live)?

Solo necesitas **actualizar las claves** en Configuración → Integraciones:
- Cambia `sk_test_...` por `sk_live_...`
- Cambia `pk_test_...` por `pk_live_...`

### ¿Puedo cambiar el email remitente después?

Sí, solo necesitas:
1. Verificar el nuevo email en SendGrid
2. Actualizar en Configuración → Integraciones → SendGrid

### ¿Qué pasa si pierdo mi API Key de SendGrid?

No pasa nada, solo crea una nueva:
1. Ve a SendGrid → Settings → API Keys
2. Crea una nueva clave
3. Actualízala en tu panel de control

---

## 🆘 ¿Necesitas ayuda?

Si tienes problemas con la configuración:

1. **Revisa los mensajes de error** en la página de Integraciones
2. **Verifica que las claves sean correctas:**
   - Stripe Secret Key empieza con `sk_test_` o `sk_live_`
   - Stripe Publishable Key empieza con `pk_test_` o `pk_live_`
   - SendGrid API Key empieza con `SG.`
3. **Asegúrate de haber verificado** el email remitente en SendGrid
4. Contacta con soporte: **soporte@tuempresa.com**

---

## 📚 Recursos útiles

- **Documentación de Stripe:** [https://stripe.com/docs](https://stripe.com/docs)
- **Documentación de SendGrid:** [https://docs.sendgrid.com/](https://docs.sendgrid.com/)
- **Tarjetas de prueba de Stripe:** [https://stripe.com/docs/testing](https://stripe.com/docs/testing)
- **Verificar email en SendGrid:** [https://docs.sendgrid.com/ui/sending-email/sender-verification](https://docs.sendgrid.com/ui/sending-email/sender-verification)

---

**✅ ¡Configuración completada!**

Ahora tu sistema está listo para recuperar pagos fallidos automáticamente y enviar emails a tus clientes. 🎉
