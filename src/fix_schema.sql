-- Create the exec_sql function if it doesn't exist
CREATE OR REPLACE FUNCTION exec_sql(sql text)
RETURNS void AS $$
BEGIN
  EXECUTE sql;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing foreign key constraints
ALTER TABLE user_departments DROP CONSTRAINT IF EXISTS user_departments_department_id_fkey;
ALTER TABLE user_departments DROP CONSTRAINT IF EXISTS user_departments_user_id_fkey;
ALTER TABLE invite_codes DROP CONSTRAINT IF EXISTS invite_codes_department_id_fkey;
ALTER TABLE invite_codes DROP CONSTRAINT IF EXISTS invite_codes_user_id_fkey;
ALTER TABLE sops DROP CONSTRAINT IF EXISTS sops_department_id_fkey;

-- Drop existing primary key constraints
ALTER TABLE departments DROP CONSTRAINT IF EXISTS departments_pkey;
ALTER TABLE user_departments DROP CONSTRAINT IF EXISTS user_departments_pkey;
ALTER TABLE user_departments DROP CONSTRAINT IF EXISTS user_companies_pkey;
ALTER TABLE invite_codes DROP CONSTRAINT IF EXISTS invite_codes_pkey;
ALTER TABLE sops DROP CONSTRAINT IF EXISTS sops_pkey;

-- Add proper primary key constraints
ALTER TABLE departments ADD CONSTRAINT departments_pkey PRIMARY KEY (department_id);
ALTER TABLE user_departments ADD CONSTRAINT user_departments_pkey PRIMARY KEY (user_id, department_id);
ALTER TABLE invite_codes ADD CONSTRAINT invite_codes_pkey PRIMARY KEY (id);
ALTER TABLE sops ADD CONSTRAINT sops_pkey PRIMARY KEY (id);

-- Add foreign key constraints
ALTER TABLE user_departments ADD CONSTRAINT user_departments_department_id_fkey 
  FOREIGN KEY (department_id) REFERENCES departments(department_id) ON DELETE CASCADE;

ALTER TABLE user_departments ADD CONSTRAINT user_departments_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE invite_codes ADD CONSTRAINT invite_codes_department_id_fkey 
  FOREIGN KEY (department_id) REFERENCES departments(department_id) ON DELETE CASCADE;

ALTER TABLE invite_codes ADD CONSTRAINT invite_codes_created_by_fkey 
  FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE sops ADD CONSTRAINT sops_department_id_fkey 
  FOREIGN KEY (department_id) REFERENCES departments(department_id) ON DELETE CASCADE;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_departments_user_id ON user_departments(user_id);
CREATE INDEX IF NOT EXISTS idx_user_departments_department_id ON user_departments(department_id);
CREATE INDEX IF NOT EXISTS idx_departments_name ON departments(name);
CREATE INDEX IF NOT EXISTS idx_invite_codes_code ON invite_codes(code);
CREATE INDEX IF NOT EXISTS idx_invite_codes_email ON invite_codes(email);
CREATE INDEX IF NOT EXISTS idx_sops_department_id ON sops(department_id);

-- Add role validation
ALTER TABLE user_departments DROP CONSTRAINT IF EXISTS user_departments_role_check;
ALTER TABLE user_departments ADD CONSTRAINT user_departments_role_check 
  CHECK (role IN ('look', 'tweak', 'build', 'manage', 'super'));

-- Add created_by column to departments if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'departments' 
    AND column_name = 'created_by'
  ) THEN
    ALTER TABLE departments ADD COLUMN created_by uuid REFERENCES auth.users(id);
  END IF;
END $$; 