-- ================================================================
-- Migration 001: Security Hardening
-- Run this in your Supabase SQL Editor
-- ================================================================

-- 1. Add user_id to sessions for session ownership tracking
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id) ON DELETE SET NULL;

-- 2. Drop the redundant admin_users table (now using users.role='admin')
DROP TABLE IF EXISTS admin_users CASCADE;

-- 3. Add missing performance indexes
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
