# 📚 Índice de Documentación - Sistema Multi-Tenant v2.4

Esta carpeta contiene todos los archivos del sistema de recuperación de pagos fallidos con soporte multi-tenant.

---

## 📖 Documentación (Léeme Primero)

### Para Empezar

| Archivo | Descripción | Audiencia |
|---|---|---|
| **[COMO-USAR.md](./COMO-USAR.md)** | 🚀 Guía rápida de inicio | Todos |
| **[README-v2.4.md](./README-v2.4.md)** | 📘 Documentación técnica completa | Desarrolladores |
| **[SETUP-EMPRESAS.md](./SETUP-EMPRESAS.md)** | 👔 Guía para clientes no técnicos | Empresas |

### Documentación Técnica

| Archivo | Descripción |
|---|---|
| **[RESUMEN-v2.4.md](./RESUMEN-v2.4.md)** | ✅ Resumen de implementación v2.4 |
| **[MIGRACION-v2.3-a-v2.4.md](./MIGRACION-v2.3-a-v2.4.md)** | 🔄 Cómo actualizar desde v2.3 |
| **[MEJORAS_v2.0.md](./MEJORAS_v2.0.md)** | 💡 Roadmap de mejoras futuras |

---

## 🗂️ Estructura del Proyecto

```
Prueba/
│
├── 📁 backend/                      # Servidor Node.js + Express
│   ├── server.js                    # Punto de entrada del servidor
│   ├── db.js                        # Base de datos SQLite
│   ├── routes.js                    # API endpoints
│   ├── auth.js                      # Autenticación JWT
│   ├── retry-logic.js               # Lógica de reintentos
│   ├── stripe-service.js            # Integración con Stripe (multi-tenant)
│   ├── mailer.js                    # Envío de emails (multi-tenant)
│   ├── encryption.js                # 🆕 Encriptación de API keys
│   ├── notification-service.js      # Sistema de notificaciones
│   ├── seed.js                      # Datos de prueba
│   ├── generate-secret.js           # 🆕 Genera ENCRYPTION_SECRET
│   ├── .env                         # Variables de entorno
│   ├── .env.example                 # Plantilla de configuración
│   └── data.db                      # Base de datos SQLite
│
├── 📁 frontend/                     # Aplicación React + Vite
│   ├── 📁 src/
│   │   ├── App.jsx                  # Componente principal
│   │   ├── Dashboard.jsx            # Dashboard de pagos
│   │   ├── Settings.jsx             # Modal de configuración (con tabs)
│   │   ├── NotificationSettings.jsx # Configuración de notificaciones
│   │   └── 📁 components/
│   │       └── IntegrationsSettings.jsx  # 🆕 Configuración de API keys
│   └── package.json
│
└── 📄 Documentación/                # Archivos que estás leyendo
    ├── COMO-USAR.md                 # 🚀 Guía de inicio rápido
    ├── README-v2.4.md               # 📘 Documentación completa
    ├── SETUP-EMPRESAS.md            # 👔 Guía para empresas
    ├── RESUMEN-v2.4.md              # ✅ Resumen de implementación
    ├── MIGRACION-v2.3-a-v2.4.md     # 🔄 Guía de migración
    ├── MEJORAS_v2.0.md              # 💡 Roadmap de mejoras
    └── INDICE.md                    # 📚 Este archivo
```

---

## 🎯 ¿Qué Archivo Leer Según tu Situación?

### 🆕 "Soy nuevo, quiero empezar a usar el sistema"
👉 Lee: **[COMO-USAR.md](./COMO-USAR.md)**

### 👔 "Compré el sistema para mi empresa, no sé programar"
👉 Lee: **[SETUP-EMPRESAS.md](./SETUP-EMPRESAS.md)**

### 💻 "Soy desarrollador, quiero entender cómo funciona"
👉 Lee: **[README-v2.4.md](./README-v2.4.md)**

### 🔄 "Ya tengo la v2.3, quiero actualizar a v2.4"
👉 Lee: **[MIGRACION-v2.3-a-v2.4.md](./MIGRACION-v2.3-a-v2.4.md)**

### 📊 "¿Qué se implementó en la v2.4?"
👉 Lee: **[RESUMEN-v2.4.md](./RESUMEN-v2.4.md)**

### 🚀 "¿Qué mejoras vienen próximamente?"
👉 Lee: **[MEJORAS_v2.0.md](./MEJORAS_v2.0.md)**

---

## 📁 Archivos Clave del Código

### Backend (Node.js)

#### Core
- **`server.js`** - Inicia el servidor Express y el scheduler
- **`db.js`** - Maneja la base de datos SQLite (pagos, users, config, integrations)
- **`routes.js`** - Define todos los endpoints de la API

#### Autenticación
- **`auth.js`** - Login, registro, verificación JWT

#### Reintentos y Pagos
- **`retry-logic.js`** - Scheduler que procesa reintentos automáticos
- **`stripe-service.js`** - Integración con Stripe (multi-tenant)

#### Comunicaciones
- **`mailer.js`** - Envío de emails con SendGrid (multi-tenant)
- **`notification-service.js`** - Sistema de notificaciones a empresas

#### Seguridad (NUEVO v2.4)
- **`encryption.js`** - Encriptación AES-256-CBC para API keys

#### Utilidades
- **`seed.js`** - Crea datos de prueba
- **`generate-secret.js`** - Genera ENCRYPTION_SECRET

### Frontend (React)

#### Vistas Principales
- **`App.jsx`** - Routing y autenticación
- **`Dashboard.jsx`** - Vista de pagos y estadísticas
- **`Settings.jsx`** - Modal de configuración con tabs

#### Componentes
- **`IntegrationsSettings.jsx`** - Configuración de Stripe y SendGrid (NUEVO v2.4)
- **`NotificationSettings.jsx`** - Configuración de emails de notificación

---

## 🔑 Variables de Entorno (`.env`)

### Requeridas

```bash
PORT=3000                          # Puerto del servidor
DATABASE_URL=./data.db             # Ruta a la base de datos
JWT_SECRET=tu_secret_jwt           # Secret para JWT
ENCRYPTION_SECRET=tu_secret_aes    # Secret para encriptar API keys (v2.4)
```

### Opcionales (DEMO)

```bash
DEMO_STRIPE_SECRET_KEY=sk_test_...     # Stripe demo (si tenant no configura)
DEMO_SENDGRID_API_KEY=SG...            # SendGrid demo
DEMO_FROM_EMAIL=no-reply@demo.local    # Email remitente demo
```

---

## 🗄️ Tablas de Base de Datos

| Tabla | Descripción |
|---|---|
| `users` | Usuarios del sistema (email, password hash, tenant_id) |
| `payments` | Pagos fallidos con reintentos |
| `config` | Configuración por tenant (intervalos, max reintentos) |
| `tenant_integrations` | 🆕 API keys encriptadas por tenant (Stripe, SendGrid) |
| `notification_settings` | Preferencias de notificaciones por tenant |

---

## 🔌 API Endpoints Principales

### Autenticación
- `POST /api/register` - Registrar nuevo usuario
- `POST /api/login` - Iniciar sesión

### Pagos
- `GET /api/payments` - Listar pagos (filtrados por tenant)
- `POST /api/test-payment` - Crear pago de prueba
- `POST /api/retry/:id` - Reintentar pago manualmente

### Configuración
- `GET /api/config` - Obtener configuración del tenant
- `POST /api/config` - Actualizar configuración

### Integraciones (NUEVO v2.4)
- `GET /api/integrations` - Obtener integraciones (keys enmascaradas)
- `POST /api/integrations` - Guardar API keys (encriptadas)

### Webhooks
- `POST /api/stripe/webhook` - Webhook de Stripe
- `POST /webhook/payment-failed` - Webhook genérico

---

## 📈 Versiones

| Versión | Fecha | Características |
|---|---|---|
| **v1.0** | Oct 2024 | Base del sistema con reintentos |
| **v2.0** | Nov 2024 | Multi-tenant + Autenticación |
| **v2.1** | Nov 2024 | Dashboard mejorado + Configuración |
| **v2.2** | Nov 2024 | Integración Stripe real |
| **v2.3** | Dic 2024 | Sistema de notificaciones |
| **v2.4** | Dic 2024 | 🆕 Multi-tenant API keys encriptadas |

---

## 🆘 Soporte

### Problemas Comunes
Revisa la sección **"Troubleshooting"** en:
- [README-v2.4.md](./README-v2.4.md#-troubleshooting)
- [COMO-USAR.md](./COMO-USAR.md#-problemas-comunes)

### Contacto
- **Email:** soporte@tuempresa.com
- **Issues:** Abre un issue en GitHub

---

## 📜 Licencia

MIT License - Puedes usar, modificar y vender este software libremente.

---

**Sistema de Recuperación de Pagos Fallidos v2.4**  
**Multi-Tenant | Encriptación AES-256 | Fácil de Usar** 💰
