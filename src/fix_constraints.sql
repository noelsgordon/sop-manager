-- Function to drop a constraint
CREATE OR REPLACE FUNCTION drop_constraint(table_name text, constraint_name text)
RETURNS void AS $$
BEGIN
    EXECUTE format('
        ALTER TABLE %I 
        DROP CONSTRAINT IF EXISTS %I;
    ', table_name, constraint_name);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to add a primary key constraint
CREATE OR REPLACE FUNCTION add_primary_key(table_name text, column_names text[])
RETURNS void AS $$
BEGIN
    EXECUTE format('
        ALTER TABLE %I 
        ADD CONSTRAINT %I_pkey 
        PRIMARY KEY (%s);
    ', table_name, table_name, array_to_string(column_names, ', '));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the exec_sql function if it doesn't exist
CREATE OR REPLACE FUNCTION exec_sql(sql text)
RETURNS void AS $$
BEGIN
  EXECUTE sql;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop the problematic constraint
ALTER TABLE user_departments DROP CONSTRAINT IF EXISTS user_companies_pkey;

-- Add the correct primary key
ALTER TABLE user_departments ADD CONSTRAINT user_departments_pkey PRIMARY KEY (user_id, department_id);

-- Add foreign key constraints
ALTER TABLE user_departments ADD CONSTRAINT user_departments_department_id_fkey 
  FOREIGN KEY (department_id) REFERENCES departments(department_id) ON DELETE CASCADE;

ALTER TABLE user_departments ADD CONSTRAINT user_departments_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Drop any foreign key constraints referencing user_companies
DO $$
BEGIN
  EXECUTE (
    SELECT 'ALTER TABLE ' || table_name || ' DROP CONSTRAINT ' || constraint_name || ';'
    FROM information_schema.table_constraints
    WHERE constraint_type = 'FOREIGN KEY'
    AND constraint_name LIKE '%user_companies%'
  );
EXCEPTION
  WHEN OTHERS THEN
    NULL;
END $$; 