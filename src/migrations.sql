-- Function to rename column in sops table
CREATE OR REPLACE FUNCTION rename_sops_column(old_name text, new_name text)
RETURNS void AS $$
BEGIN
  EXECUTE format('ALTER TABLE sops RENAME COLUMN %I TO %I', old_name, new_name);
END;
$$ LANGUAGE plpgsql;

-- Function to rename column in invite_codes table
CREATE OR REPLACE FUNCTION rename_invite_codes_column(old_name text, new_name text)
RETURNS void AS $$
BEGIN
  EXECUTE format('ALTER TABLE invite_codes RENAME COLUMN %I TO %I', old_name, new_name);
END;
$$ LANGUAGE plpgsql;

-- Function to update user department roles
CREATE OR REPLACE FUNCTION update_user_department_roles()
RETURNS void AS $$
BEGIN
  UPDATE user_departments 
  SET role = CASE 
      WHEN role = 'Viewer' THEN 'Look'
      WHEN role = 'Updater' THEN 'Tweak'
      WHEN role = 'Creator' THEN 'Build'
      WHEN role = 'Admin' THEN 'Manage'
      WHEN role = 'Superadmin' THEN 'Super'
      ELSE role 
  END
  WHERE role IS NOT NULL AND role != '';
END;
$$ LANGUAGE plpgsql; 