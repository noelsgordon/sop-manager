-- Function to normalize roles
CREATE OR REPLACE FUNCTION normalize_role_on_insert()
RETURNS TRIGGER AS $$
BEGIN
  -- Convert role to lowercase first
  NEW.role = LOWER(NEW.role);
  
  -- Map old role names to new ones
  NEW.role = CASE 
    WHEN NEW.role = 'viewer' THEN 'look'
    WHEN NEW.role = 'updater' THEN 'tweak'
    WHEN NEW.role = 'creator' THEN 'build'
    WHEN NEW.role = 'admin' THEN 'manage'
    WHEN NEW.role = 'superadmin' THEN 'super'
    ELSE NEW.role
  END;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for user_departments table
DROP TRIGGER IF EXISTS normalize_role_user_departments ON user_departments;
CREATE TRIGGER normalize_role_user_departments
  BEFORE INSERT OR UPDATE ON user_departments
  FOR EACH ROW
  EXECUTE FUNCTION normalize_role_on_insert();

-- Create trigger for invite_codes table
DROP TRIGGER IF EXISTS normalize_role_invite_codes ON invite_codes;
CREATE TRIGGER normalize_role_invite_codes
  BEFORE INSERT OR UPDATE ON invite_codes
  FOR EACH ROW
  EXECUTE FUNCTION normalize_role_on_insert(); 