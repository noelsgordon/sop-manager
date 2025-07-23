-- Function to create the fix_departments function
CREATE OR REPLACE FUNCTION create_fix_departments_function()
RETURNS void AS $$
BEGIN
  -- Drop existing function if it exists
  DROP FUNCTION IF EXISTS fix_departments();
  
  -- Create the function
  CREATE OR REPLACE FUNCTION fix_departments()
  RETURNS jsonb AS $$
  DECLARE
    result jsonb;
  BEGIN
    -- Create temporary table for unique departments
    CREATE TEMP TABLE unique_departments AS
    SELECT DISTINCT ON (name)
      id,
      name,
      created_at
    FROM departments
    ORDER BY name, created_at;

    -- Delete all departments
    DELETE FROM departments;

    -- Reinsert unique departments
    INSERT INTO departments (id, name, created_at)
    SELECT id, name, created_at
    FROM unique_departments;

    -- Ensure Default Department exists
    INSERT INTO departments (id, name, created_at)
    SELECT 
      gen_random_uuid(),
      'Default Department',
      now()
    WHERE NOT EXISTS (
      SELECT 1 FROM departments WHERE name = 'Default Department'
    );

    -- Get results
    SELECT 
      jsonb_build_object(
        'departments_count', (SELECT count(*) FROM departments),
        'default_department', (SELECT row_to_json(d) FROM departments d WHERE name = 'Default Department')
      )
    INTO result;

    -- Clean up
    DROP TABLE unique_departments;

    RETURN result;
  END;
  $$ LANGUAGE plpgsql;
END;
$$ LANGUAGE plpgsql;

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

-- Drop the user_companies_pkey constraint if it exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE constraint_name = 'user_companies_pkey'
  ) THEN
    ALTER TABLE user_departments DROP CONSTRAINT IF EXISTS user_companies_pkey;
  END IF;
END $$;

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

-- Create a new primary key constraint for user_departments if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE constraint_name = 'user_departments_pkey'
    AND table_name = 'user_departments'
  ) THEN
    ALTER TABLE user_departments ADD PRIMARY KEY (user_id, department_id);
  END IF;
END $$; 