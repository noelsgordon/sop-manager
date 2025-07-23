-- Temporarily disable RLS on all tables for testing
-- This will allow full access for testing purposes

ALTER TABLE user_profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_departments DISABLE ROW LEVEL SECURITY;
ALTER TABLE departments DISABLE ROW LEVEL SECURITY;
ALTER TABLE sops DISABLE ROW LEVEL SECURITY;
ALTER TABLE sop_steps DISABLE ROW LEVEL SECURITY;
ALTER TABLE invite_codes DISABLE ROW LEVEL SECURITY;
ALTER TABLE role_definitions DISABLE ROW LEVEL SECURITY; 