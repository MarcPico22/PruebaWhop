-- Fix achievements table in Railway
-- Execute this in Railway with: railway run sqlite3 /data/database.sqlite < fix_achievements.sql

-- Create achievements table if not exists
CREATE TABLE IF NOT EXISTS achievements (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  tenant_id TEXT NOT NULL,
  badge_type TEXT NOT NULL,
  unlocked_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
  metadata TEXT,
  UNIQUE(user_id, badge_type),
  FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_achievements_user_id ON achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_achievements_tenant_id ON achievements(tenant_id);

-- Add onboarding columns to users if they don't exist
-- Note: SQLite doesn't support ALTER TABLE IF COLUMN NOT EXISTS, so we ignore errors
-- ALTER TABLE users ADD COLUMN onboarding_step INTEGER DEFAULT 0;
-- ALTER TABLE users ADD COLUMN onboarding_completed_at INTEGER;

-- Create index for onboarding
CREATE INDEX IF NOT EXISTS idx_users_onboarding_step ON users(onboarding_step);

-- Verify tables exist
.tables

-- Show achievements table schema
.schema achievements
