/*
  # Fix Database Views and Relationships

  1. Changes
    - Drop and recreate views without user_metadata
    - Add missing foreign key constraints
    - Update RLS policies

  2. Security
    - Maintain existing RLS policies
    - Add proper access controls for views
*/

-- Drop existing views if they exist
DROP VIEW IF EXISTS customer_profiles;
DROP VIEW IF EXISTS lender_profiles;

-- Create secure view for customers
CREATE OR REPLACE VIEW customer_profiles AS
SELECT 
  c.*,
  au.email
FROM customers c
JOIN auth.users au ON c.id = au.id;

-- Create secure view for lenders
CREATE OR REPLACE VIEW lender_profiles AS
SELECT 
  l.*,
  au.email
FROM lenders l
JOIN auth.users au ON l.id = au.id;

-- Add missing foreign key constraints
ALTER TABLE loans
DROP CONSTRAINT IF EXISTS loans_customer_id_fkey,
ADD CONSTRAINT loans_customer_id_fkey 
  FOREIGN KEY (customer_id) 
  REFERENCES customers(id)
  ON DELETE CASCADE;

ALTER TABLE loans
DROP CONSTRAINT IF EXISTS loans_lender_id_fkey,
ADD CONSTRAINT loans_lender_id_fkey 
  FOREIGN KEY (lender_id) 
  REFERENCES lenders(id)
  ON DELETE CASCADE;

ALTER TABLE customer_risk_assessments
DROP CONSTRAINT IF EXISTS customer_risk_assessments_customer_id_fkey,
ADD CONSTRAINT customer_risk_assessments_customer_id_fkey 
  FOREIGN KEY (customer_id) 
  REFERENCES customers(id)
  ON DELETE CASCADE;

ALTER TABLE customer_risk_assessments
DROP CONSTRAINT IF EXISTS customer_risk_assessments_vendor_id_fkey,
ADD CONSTRAINT customer_risk_assessments_vendor_id_fkey 
  FOREIGN KEY (vendor_id) 
  REFERENCES lenders(id)
  ON DELETE CASCADE;

-- Grant access to views
GRANT SELECT ON customer_profiles TO authenticated;
GRANT SELECT ON lender_profiles TO authenticated;

-- Add RLS policies for views
CREATE POLICY "Users can view own customer profile"
  ON customers
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = id OR 
    EXISTS (
      SELECT 1 FROM lenders WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can view own lender profile"
  ON lenders
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = id OR 
    EXISTS (
      SELECT 1 FROM customers WHERE id = auth.uid()
    )
  );