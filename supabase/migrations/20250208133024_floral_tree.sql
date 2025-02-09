/*
  # Create secure views for user profiles

  1. Changes
    - Create views to combine user data with auth emails
    - Add functions to check access permissions
    - Create secure views with row-level security built into the view definitions

  2. Security
    - Views include security checks in their definitions
    - Access control through view WHERE clauses
*/

-- Create a function to check if a user can access lender data
CREATE OR REPLACE FUNCTION check_lender_access(user_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN (
    -- Allow access to own data
    auth.uid() = user_id
    OR
    -- Allow customers to view lender data
    EXISTS (
      SELECT 1 FROM customers WHERE id = auth.uid()
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to check if a user can access customer data
CREATE OR REPLACE FUNCTION check_customer_access(user_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN (
    -- Allow access to own data
    auth.uid() = user_id
    OR
    -- Allow lenders to view customer data
    EXISTS (
      SELECT 1 FROM lenders WHERE id = auth.uid()
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a secure view for lenders that includes security checks
CREATE OR REPLACE VIEW lender_profiles AS
SELECT 
  l.*,
  au.email
FROM lenders l
JOIN auth.users au ON l.id = au.id
WHERE check_lender_access(l.id);

-- Create a secure view for customers that includes security checks
CREATE OR REPLACE VIEW customer_profiles AS
SELECT 
  c.*,
  au.email
FROM customers c
JOIN auth.users au ON c.id = au.id
WHERE check_customer_access(c.id);

-- Grant access to authenticated users
GRANT SELECT ON lender_profiles TO authenticated;
GRANT SELECT ON customer_profiles TO authenticated;