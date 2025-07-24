-- RLS Implementation Plan - Test Environment Setup
-- Run this in Supabase SQL Editor to create test tables

-- Step 1: Create test tables for each real table
-- These will be used to test RLS policies before applying to real tables

-- Test table for user_profiles
CREATE TABLE IF NOT EXISTS test_user_profiles (
  user_id UUID PRIMARY KEY,
  email TEXT,
  display_name TEXT,
  first_name TEXT,
  last_name TEXT,
  is_superadmin BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Test table for departments
CREATE TABLE IF NOT EXISTS test_departments (
  department_id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  created_by UUID,
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB
);

-- Test table for user_departments
CREATE TABLE IF NOT EXISTS test_user_departments (
  user_id UUID,
  department_id UUID,
  role TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (user_id, department_id)
);

-- Test table for invite_codes
CREATE TABLE IF NOT EXISTS test_invite_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  email TEXT,
  department_id UUID,
  role TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Test table for sops
CREATE TABLE IF NOT EXISTS test_sops (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  department_id UUID,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_deleted BOOLEAN DEFAULT FALSE,
  tags TEXT[]
);

-- Test table for sop_steps
CREATE TABLE IF NOT EXISTS test_sop_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sop_id UUID,
  step_number INTEGER NOT NULL,
  instruction TEXT,
  tools TEXT,
  parts TEXT,
  photo TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 2: Insert some test data
INSERT INTO test_user_profiles (user_id, email, display_name, first_name, last_name, is_superadmin) VALUES
('11111111-1111-1111-1111-111111111111', 'test@example.com', 'Test User', 'Test', 'User', false),
('22222222-2222-2222-2222-222222222222', 'admin@example.com', 'Admin User', 'Admin', 'User', true);

INSERT INTO test_departments (department_id, name, created_by, is_default) VALUES
('33333333-3333-3333-3333-333333333333', 'Test Department 1', '11111111-1111-1111-1111-111111111111', false),
('44444444-4444-4444-4444-444444444444', 'Test Department 2', '22222222-2222-2222-2222-222222222222', false);

INSERT INTO test_user_departments (user_id, department_id, role) VALUES
('11111111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333333', 'build'),
('22222222-2222-2222-2222-222222222222', '33333333-3333-3333-3333-333333333333', 'manage'),
('22222222-2222-2222-2222-222222222222', '44444444-4444-4444-4444-444444444444', 'manage');

-- Step 3: Enable RLS on test tables (we'll add policies later)
ALTER TABLE test_user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE test_departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE test_user_departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE test_invite_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE test_sops ENABLE ROW LEVEL SECURITY;
ALTER TABLE test_sop_steps ENABLE ROW LEVEL SECURITY;

-- Step 4: Create basic RLS policies for test tables
-- These are the same policies we'll apply to real tables later

-- Test user_profiles policies
CREATE POLICY "Test users can view all profiles" ON test_user_profiles
  FOR SELECT USING (true);

CREATE POLICY "Test users can insert own profile" ON test_user_profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Test users can update own profile" ON test_user_profiles
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Test only superadmins can delete profiles" ON test_user_profiles
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM test_user_profiles 
      WHERE user_id = auth.uid() AND is_superadmin = true
    )
  );

CREATE POLICY "Test superadmins have full access" ON test_user_profiles
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM test_user_profiles 
      WHERE user_id = auth.uid() AND is_superadmin = true
    )
  );

-- Test departments policies
CREATE POLICY "Test users can view departments" ON test_departments
  FOR SELECT USING (true);

CREATE POLICY "Test only superadmins can manage departments" ON test_departments
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM test_user_profiles 
      WHERE user_id = auth.uid() AND is_superadmin = true
    )
  );

-- Test user_departments policies
CREATE POLICY "Test users can view own departments" ON test_user_departments
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Test only superadmins can manage user departments" ON test_user_departments
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM test_user_profiles 
      WHERE user_id = auth.uid() AND is_superadmin = true
    )
  );

-- Test invite_codes policies
CREATE POLICY "Test users can view invite codes" ON test_invite_codes
  FOR SELECT USING (true);

CREATE POLICY "Test only superadmins can manage invite codes" ON test_invite_codes
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM test_user_profiles 
      WHERE user_id = auth.uid() AND is_superadmin = true
    )
  );

-- Test sops policies
CREATE POLICY "Test users can view sops in their departments" ON test_sops
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM test_user_departments 
      WHERE user_id = auth.uid() AND department_id = test_sops.department_id
    )
  );

CREATE POLICY "Test users can create sops in their departments" ON test_sops
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM test_user_departments 
      WHERE user_id = auth.uid() AND department_id = test_sops.department_id
    )
  );

CREATE POLICY "Test users can update sops in their departments" ON test_sops
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM test_user_departments 
      WHERE user_id = auth.uid() AND department_id = test_sops.department_id
    )
  );

CREATE POLICY "Test users can delete sops in their departments" ON test_sops
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM test_user_departments 
      WHERE user_id = auth.uid() AND department_id = test_sops.department_id
    )
  );

-- Test sop_steps policies
CREATE POLICY "Test users can view steps for sops in their departments" ON test_sop_steps
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM test_sops s
      JOIN test_user_departments ud ON s.department_id = ud.department_id
      WHERE ud.user_id = auth.uid() AND s.id = test_sop_steps.sop_id
    )
  );

CREATE POLICY "Test users can manage steps for sops in their departments" ON test_sop_steps
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM test_sops s
      JOIN test_user_departments ud ON s.department_id = ud.department_id
      WHERE ud.user_id = auth.uid() AND s.id = test_sop_steps.sop_id
    )
  );

-- Step 5: Create a test page component to test these policies
-- (This will be created in a separate file)

-- Step 6: Verification queries
-- Run these to verify the test environment is set up correctly

-- Check test tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_name LIKE 'test_%' AND table_schema = 'public';

-- Check RLS is enabled on test tables
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename LIKE 'test_%';

-- Check policies exist on test tables
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename LIKE 'test_%'; 