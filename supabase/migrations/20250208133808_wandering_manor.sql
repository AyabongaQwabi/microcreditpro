/*
  # Create secure views for user profiles

  1. New Functions
    - `check_lender_access`: Security function to control access to lender data
    - `check_customer_access`: Security function to control access to customer data

  2. New Views
    - `lender_profiles`: Secure view combining lender data with auth email
    - `customer_profiles`: Secure view combining customer data with auth email

  3. Security
    - Functions are SECURITY DEFINER to run with elevated privileges
    - Views use security functions to enforce access control
    - Explicit grants to authenticated users
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