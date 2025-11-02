-- ========================================
-- WHOP RECOVERY - RAILWAY MIGRATIONS
-- Execute this in Railway's SQLite database
-- ========================================

-- Step 1: Add onboarding columns to users table (if not exist)
ALTER TABLE users ADD COLUMN onboarding_step INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN onboarding_completed_at INTEGER;

-- Step 2: Create achievements table (if not exist)
CREATE TABLE IF NOT EXISTS achievements (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  tenant_id TEXT NOT NULL,
  badge_type TEXT NOT NULL,
  unlocked_at INTEGER NOT NULL,
  metadata TEXT,
  UNIQUE(user_id, badge_type)
);

-- Step 3: Create indices for performance
CREATE INDEX IF NOT EXISTS idx_achievements_user_id ON achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_achievements_tenant_id ON achievements(tenant_id);
CREATE INDEX IF NOT EXISTS idx_users_onboarding_step ON users(onboarding_step);

-- Verify tables
SELECT name FROM sqlite_master WHERE type='table';
