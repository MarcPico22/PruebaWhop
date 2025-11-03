-- ============================================
-- Migration: SendGrid → MailerSend
-- Objetivo: Renombrar columnas de SendGrid a MailerSend
-- Fecha: 2025-11-03
-- ============================================

-- SQLite no soporta ALTER COLUMN RENAME directamente
-- Necesitamos recrear la tabla con los nuevos nombres

BEGIN TRANSACTION;

-- 1. Crear nueva tabla temporal con nombres correctos
CREATE TABLE tenant_integrations_new (
  tenant_id TEXT PRIMARY KEY,
  stripe_secret_key TEXT,
  stripe_publishable_key TEXT,
  stripe_webhook_secret TEXT,
  mailersend_api_key TEXT,  -- CAMBIO: sendgrid_api_key → mailersend_api_key
  from_email TEXT,
  whop_api_key TEXT,
  is_stripe_connected INTEGER NOT NULL DEFAULT 0,
  is_mailersend_connected INTEGER NOT NULL DEFAULT 0,  -- CAMBIO: is_sendgrid_connected → is_mailersend_connected
  is_whop_connected INTEGER NOT NULL DEFAULT 0,
  updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
);

-- 2. Copiar datos de la tabla antigua a la nueva
INSERT INTO tenant_integrations_new (
  tenant_id,
  stripe_secret_key,
  stripe_publishable_key,
  stripe_webhook_secret,
  mailersend_api_key,
  from_email,
  whop_api_key,
  is_stripe_connected,
  is_mailersend_connected,
  is_whop_connected,
  updated_at
)
SELECT 
  tenant_id,
  stripe_secret_key,
  stripe_publishable_key,
  stripe_webhook_secret,
  sendgrid_api_key,  -- Copia de sendgrid_api_key → mailersend_api_key
  from_email,
  whop_api_key,
  is_stripe_connected,
  is_sendgrid_connected,  -- Copia de is_sendgrid_connected → is_mailersend_connected
  is_whop_connected,
  updated_at
FROM tenant_integrations;

-- 3. Eliminar tabla antigua
DROP TABLE tenant_integrations;

-- 4. Renombrar nueva tabla
ALTER TABLE tenant_integrations_new RENAME TO tenant_integrations;

-- 5. Recrear índices si existen
-- (No hay índices en la tabla original, pero añádelos si los necesitas)

COMMIT;

-- ============================================
-- VERIFICACIÓN
-- ============================================
-- Ejecuta esto después de la migración:
-- SELECT * FROM tenant_integrations LIMIT 5;
-- Deberías ver las columnas: mailersend_api_key, is_mailersend_connected
