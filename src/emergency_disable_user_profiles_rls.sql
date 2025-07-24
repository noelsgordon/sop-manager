-- EMERGENCY: Disable RLS on user_profiles to restore access
-- Run this immediately in Supabase SQL Editor

-- Disable RLS on user_profiles table
ALTER TABLE user_profiles DISABLE ROW LEVEL SECURITY;

-- Drop all policies to ensure clean state
DROP POLICY IF EXISTS "Users can view all profiles" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;
DROP POLICY IF EXISTS "Only superadmins can delete profiles" ON user_profiles;
DROP POLICY IF EXISTS "Superadmins have full access" ON user_profiles;

-- This will restore full access to user_profiles table
-- Users should be able to log in again immediately 