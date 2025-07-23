-- Rename company_id to department_id in sops table
ALTER TABLE sops RENAME COLUMN company_id TO department_id;

-- Rename company_id to department_id in invite_codes table
ALTER TABLE invite_codes RENAME COLUMN company_id TO department_id; 