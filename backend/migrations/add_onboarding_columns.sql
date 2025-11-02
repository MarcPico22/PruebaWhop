-- Migration: Add onboarding columns to users table
-- Date: 2025-11-02
-- Description: Add onboarding_step and onboarding_completed_at columns

-- Check if columns exist before adding them
-- SQLite doesn't support IF NOT EXISTS for ALTER COLUMN, so we'll use a different approach

-- Add onboarding_step column (default 0)
-- If column already exists, this will error but we can ignore it
ALTER TABLE users ADD COLUMN onboarding_step INTEGER DEFAULT 0;

-- Add onboarding_completed_at column (nullable timestamp)
ALTER TABLE users ADD COLUMN onboarding_completed_at INTEGER;

-- Update existing users to have onboarding_step = 0
UPDATE users SET onboarding_step = 0 WHERE onboarding_step IS NULL;

-- Optional: Mark all existing users as having completed onboarding (or not)
-- UPDATE users SET onboarding_completed_at = strftime('%s', 'now') WHERE onboarding_step = 0;
