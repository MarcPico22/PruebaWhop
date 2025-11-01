# ✅ TODO List - Whop Recovery

## 🔴 CRÍTICO (Bloquea producción)

- [ ] **Railway Volume** - Configurar volumen persistente
  - Railway Dashboard → Settings → Volumes → + New Volume
  - Mount Path: `/data`
  - Size: 1 GB
  - **Sin esto la BD se borra cada restart**
  - Guía: Ver `RAILWAY_SETUP.md`

- [ ] **SendGrid Verificación** - Emails no funcionan (403 Forbidden)
  - Opción 1: Verificar `marcp2001@gmail.com` (5 min)
  - Opción 2: Verificar dominio `whoprecovery.com` (1 hora)
  - Guía: Ver `SENDGRID_SETUP.md`

## 🟡 ALTA PRIORIDAD (Afecta UX)

- [ ] **Iconos PWA** - Crear icon-192.png y icon-512.png
  - Diseño: Fondo indigo (#4F46E5) con símbolo € o 💰
  - 192x192 y 512x512 pixels, PNG
  - Generador: https://realfavicongenerator.net/
  - **Mientras tanto**: Manifest sin iconos para evitar errores

- [ ] **Service Worker v2** - Arreglar pantalla en blanco en Google
  - ✅ Ya pusheado fix que ignora chrome-extension://
  - Espera redeploy en Vercel (2-3 min)
  - Test: Buscar en Google → Click resultado → Debe cargar

## 🟢 MEJORAS (No urgente pero importante)

### Frontend Mobile
- [x] Landing Page responsive
- [x] Pricing mobile toggle 48px
- [ ] Dashboard mobile - Optimizar toolbar y gráficos
  - Filtros responsive
  - Gráfico horizontal scroll en mobile

### A/B Testing
- [ ] Probar 3 variantes headlines en LandingPageAB.jsx
  - Cambiar `HEADLINE_VARIANT = 'A'` a 'B' o 'C'
  - Medir conversión en Google Analytics
  - Elegir ganador

### Backend
- [x] Stripe checkout yearly/monthly fix
- [x] Database path Railway volume
- [ ] Webhooks de Stripe (para notificaciones en tiempo real)
- [ ] Logs estructurados (Winston o similar)

### Monitoring
- [ ] Sentry para error tracking
- [ ] Google Analytics eventos personalizados
  - Botón "Seleccionar Plan" click
  - Checkout iniciado
  - Signup completado

## 📊 Métricas Objetivo

**MVP (Minimum Viable Product):**
- ✅ Landing page funcional
- ✅ Signup/Login working
- ⏳ BD persistente (necesita Railway Volume)
- ⏳ Emails funcionando (necesita SendGrid)
- ✅ Pricing con Stripe
- ✅ Dashboard básico

**Post-Launch:**
- 100 signups en primer mes
- 10 conversiones a PRO
- 2 conversiones a ENTERPRISE
- Tasa conversión > 5%

## 🚀 Orden Recomendado

1. **HOY** - Railway Volume (crítico, 5 min)
2. **HOY** - SendGrid verificar email (crítico, 5 min)
3. **Esta semana** - Iconos PWA (mejora UX)
4. **Esta semana** - A/B testing headlines
5. **Próxima semana** - Sentry + analytics avanzado

---

## ✅ Completado

- [x] Landing page reescrita (Baremetrics style)
- [x] Pricing mobile optimizado
- [x] PWA manifest y service worker
- [x] Stripe checkout yearly/monthly fix
- [x] Service worker chrome-extension fix
- [x] Database path para Railway volume
- [x] Login/Signup responsive
- [x] Dashboard desktop funcional

---

**Última actualización**: 1 Nov 2025
**Estado**: 70% MVP completo, faltan 2 acciones críticas (Railway + SendGrid)
