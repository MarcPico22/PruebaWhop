# Política de Privacidad - Whop Recovery

**Última actualización: 1 de noviembre de 2025**

---

## 1. Introducción

En Whop Recovery ("nosotros", "nuestro"), respetamos tu privacidad y nos comprometemos a proteger tus datos personales.

Esta Política explica:
- Qué datos recopilamos
- Cómo los usamos
- Cómo los protegemos
- Tus derechos sobre tus datos

**Al usar Whop Recovery, aceptas esta Política de Privacidad.**

---

## 2. Información que Recopilamos

### 2.1 Datos de Registro

Cuando te registras, recopilamos:

- ✉️ **Email** (para login y notificaciones)
- 🏢 **Nombre de empresa** (para personalización)
- 🔑 **Contraseña** (encriptada, nunca almacenamos en texto plano)
- 📅 **Fecha de registro**

### 2.2 Datos de Integraciones

Para que el servicio funcione, guardamos:

- 🔐 **API Keys de terceros** (Whop, Stripe, etc.)
  - Encriptadas con AES-256
  - Solo tú puedes verlas/modificarlas
- 🔗 **IDs de cliente** en plataformas externas

### 2.3 Datos de Transacciones

Almacenamos información de pagos fallidos:

- 💳 **ID de transacción** (de Whop/Stripe)
- 💰 **Monto del pago**
- 📧 **Email del cliente final** (para enviar recordatorios)
- 📊 **Estado del reintento** (pendiente, recuperado, fallido)
- 🕐 **Fechas y hora** de cada intento

### 2.4 Datos de Uso

Recopilamos automáticamente:

- 📍 **Dirección IP** (para seguridad y analytics)
- 🌐 **Navegador y dispositivo** (para optimizar UX)
- ⏱️ **Tiempo de uso** (para estadísticas)
- 🔧 **Logs de errores** (para debugging)

### 2.5 Datos de Facturación

Procesados por Stripe (no los almacenamos):

- 💳 Número de tarjeta (Stripe)
- 📍 Dirección de facturación (Stripe)
- 📄 Historial de pagos (Stripe)

**⚠️ Importante:** Nunca vemos ni almacenamos tu información bancaria completa.

---

## 3. Cómo Usamos tus Datos

### 3.1 Proporcionar el Servicio

- ✅ Detectar pagos fallidos en tus integraciones
- ✅ Enviar emails de reintento a tus clientes
- ✅ Mostrar estadísticas en tu Dashboard
- ✅ Procesar tu suscripción y pagos

### 3.2 Mejorar el Servicio

- 📊 Analizar patrones de uso (anonimizado)
- 🐛 Detectar y corregir errores
- 🚀 Desarrollar nuevas funcionalidades
- 📈 Optimizar tasas de recuperación

### 3.3 Comunicación

- 📧 Emails transaccionales (confirmación, reintentos)
- 🔔 Alertas de sistema (límites, errores)
- 📰 Newsletter ocasional (puedes darte de baja)
- 🎯 Ofertas relevantes (solo si aceptas)

### 3.4 Cumplimiento Legal

- ⚖️ Responder a solicitudes legales
- 🛡️ Prevenir fraude y abuso
- 📋 Cumplir regulaciones (GDPR, etc.)

---

## 4. Base Legal para Procesar Datos (GDPR)

Procesamos tus datos bajo estas bases legales:

| Dato | Base Legal |
|------|------------|
| Email, contraseña | **Ejecución del contrato** (necesario para el servicio) |
| API Keys | **Ejecución del contrato** |
| Datos de facturación | **Obligación legal** (facturación fiscal) |
| Analytics | **Interés legítimo** (mejorar el servicio) |
| Marketing | **Consentimiento** (puedes retirarlo) |

---

## 5. Con Quién Compartimos tus Datos

### 5.1 Proveedores de Servicios (Subprocesadores)

Compartimos datos solo con proveedores esenciales:

| Proveedor | Propósito | Ubicación |
|-----------|-----------|-----------|
| **Stripe** | Procesar pagos de suscripciones | UE/EE.UU. |
| **MailerSend** | Enviar emails transaccionales | UE/EE.UU. |
| **Railway** | Hosting del backend | EE.UU. |
| **Vercel** | Hosting del frontend | EE.UU. |

**Todos tienen acuerdos de protección de datos (DPA) conformes a GDPR.**

### 5.2 Integraciones de Usuario

Cuando conectas Whop/Stripe:

- Enviamos tu API Key a esas plataformas
- Solo para obtener datos de pagos fallidos
- Bajo tu control (puedes desconectar en cualquier momento)

### 5.3 NO Compartimos con:

❌ Empresas de publicidad  
❌ Brokers de datos  
❌ Redes sociales  
❌ Terceros no autorizados

---

## 6. Seguridad de los Datos

### 6.1 Medidas Técnicas

- 🔐 **Encriptación AES-256** para API keys
- 🔒 **HTTPS/TLS** en todas las comunicaciones
- 🔑 **Hashing bcrypt** para contraseñas
- 🛡️ **JWT tokens** para autenticación
- 🚨 **Rate limiting** contra ataques

### 6.2 Medidas Organizativas

- 👤 **Acceso restringido** solo a personal autorizado
- 📋 **Políticas de seguridad** internas
- 🔄 **Backups diarios** automáticos
- 🧪 **Pruebas de seguridad** regulares

### 6.3 En Caso de Brecha

Si hay una violación de seguridad:

1. Te notificamos en **72 horas**
2. Informamos a autoridades (si es requerido)
3. Tomamos medidas correctivas inmediatas
4. Publicamos un informe post-mortem

---

## 7. Retención de Datos

### 7.1 Cuenta Activa

Mientras uses el servicio:

- ♾️ Datos de cuenta (indefinidamente)
- 📊 Datos de transacciones (12 meses)
- 📧 Logs de emails (6 meses)
- 🔧 Logs de sistema (3 meses)

### 7.2 Después de Cancelar

- 🗂️ Conservamos datos **30 días** (para reactivación)
- 📄 Datos de facturación **7 años** (obligación fiscal)
- 🗑️ Resto se elimina **permanentemente**

---

## 8. Tus Derechos (GDPR)

Como usuario en la UE, tienes derecho a:

### 8.1 Acceso (Art. 15 GDPR)

📥 **Solicitar copia** de todos tus datos  
→ Respuesta en 30 días

### 8.2 Rectificación (Art. 16)

✏️ **Corregir datos** incorrectos  
→ Desde Dashboard → Configuración

### 8.3 Supresión (Art. 17)

🗑️ **"Derecho al olvido"** - Eliminar tu cuenta  
→ Dashboard → Configuración → Eliminar Cuenta

### 8.4 Portabilidad (Art. 20)

📤 **Exportar tus datos** en formato JSON  
→ Dashboard → Configuración → Exportar Datos

### 8.5 Oposición (Art. 21)

🚫 **Oponerte a procesamiento** (ej: marketing)  
→ Configuración → Preferencias de Email

### 8.6 Restricción (Art. 18)

⏸️ **Limitar procesamiento** temporalmente  
→ Contacta a marcp2001@gmail.com

### 8.7 Reclamar

⚖️ **Presentar queja** ante autoridad de protección de datos  
🇪🇸 España: [AEPD](https://www.aepd.es/)

---

## 9. Cookies y Tecnologías Similares

### 9.1 Cookies Esenciales

✅ **Siempre activas** (necesarias para login):

- `token` - Autenticación JWT (7 días)
- `session_id` - Sesión activa

### 9.2 Cookies Analíticas

📊 **Opcionales** (para estadísticas):

- Google Analytics (si aceptas)
- Puedes desactivarlas en Configuración

### 9.3 Sin Cookies de Publicidad

❌ No usamos cookies de tracking de terceros

---

## 10. Transferencias Internacionales

### 10.1 Ubicación de Datos

- 🇪🇺 **Primaria**: Servidores en la UE (Railway EU region)
- 🇺🇸 **Secundaria**: Backups en EE.UU. (encriptados)

### 10.2 Salvaguardias

Para transferencias UE → EE.UU.:

- ✅ **Cláusulas Contractuales Estándar** (SCC)
- ✅ **Privacy Shield** (proveedores certificados)
- ✅ **Encriptación** en tránsito y reposo

---

## 11. Menores de Edad

🚫 **Whop Recovery NO es para menores de 18 años.**

Si descubrimos que un menor se registró:
1. Eliminaremos su cuenta inmediatamente
2. Borraremos sus datos
3. Notificaremos a los padres (si es posible)

---

## 12. Cambios a esta Política

- 📝 Podemos actualizar esta Política ocasionalmente
- 📧 Te notificaremos por email 15 días antes
- 📅 Fecha de actualización al inicio del documento
- 🔗 Historial de versiones disponible bajo solicitud

---

## 13. Contacto - Delegado de Protección de Datos (DPO)

Para ejercer tus derechos o preguntas sobre privacidad:

📧 **Email**: marcp2001@gmail.com  
📬 **Asunto**: "Privacidad - [Tu Solicitud]"  
⏱️ **Respuesta**: 30 días máximo

🌐 **Web**: https://www.whoprecovery.com/privacy  
📍 **Dirección postal**: Guirigall, Palma de Mallorca, España

---

## 14. Compromiso de Transparencia

Nos comprometemos a:

- ✅ Ser transparentes sobre qué datos usamos
- ✅ Darte control total sobre tu información
- ✅ Proteger tus datos con la mejor tecnología
- ✅ Cumplir con GDPR y todas las leyes aplicables
- ✅ Responderte rápidamente a tus solicitudes

**Tus datos son TUYOS. Nosotros solo somos custodios temporales.**

---

**© 2025 Whop Recovery. Todos los derechos reservados.**

---

### Resumen Ejecutivo (TL;DR)

✅ **Recopilamos**: Email, empresa, API keys (encriptadas), datos de transacciones  
✅ **Usamos**: Solo para dar el servicio y mejorarlo  
✅ **Compartimos**: Solo con proveedores esenciales (Stripe, MailerSend)  
✅ **Protegemos**: Encriptación, HTTPS, backups  
✅ **Tus derechos**: Acceso, corrección, eliminación, exportación  
✅ **Contacto**: marcp2001@gmail.com  

**¿Preguntas? Estamos aquí para ayudarte. 📧**
