/*
  # Fix Schema Views and Add Missing Columns

  1. Changes
    - Update customer_profiles view to include profile_picture
    - Update lender_profiles view to include rating
    - Add missing columns to loan_offers table
    - Add missing columns to loan_payments table
    - Add missing columns to loans table

  2. Security
    - Maintain existing RLS policies
    - Ensure proper view access
*/

-- Drop existing views
DROP VIEW IF EXISTS customer_profiles;
DROP VIEW IF EXISTS lender_profiles;

-- Create updated customer_profiles view
CREATE OR REPLACE VIEW customer_profiles AS
SELECT 
  c.id,
  c.full_name,
  c.phone,
  c.address,
  c.employment_status,
  c.monthly_income,
  c.sa_id_number,
  c.profile_picture,
  c.created_at,
  c.updated_at,
  au.email
FROM customers c
JOIN auth.users au ON c.id = au.id;

-- Create updated lender_profiles view
CREATE OR REPLACE VIEW lender_profiles AS
SELECT 
  l.id,
  l.business_name,
  l.contact_name,
  l.phone,
  l.address,
  l.business_license,
  l.rating,
  l.created_at,
  l.updated_at,
  au.email
FROM lenders l
JOIN auth.users au ON l.id = au.id;

-- Grant access to views
GRANT SELECT ON customer_profiles TO authenticated;
GRANT SELECT ON lender_profiles TO authenticated;

-- Add missing columns to loan_offers if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'loan_offers' AND column_name = 'terms_sets'
  ) THEN
    ALTER TABLE loan_offers ADD COLUMN terms_sets uuid[] DEFAULT '{}';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'loan_offers' AND column_name = 'custom_terms'
  ) THEN
    ALTER TABLE loan_offers ADD COLUMN custom_terms text DEFAULT '';
  END IF;
END $$;

-- Add missing columns to loans if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'loans' AND column_name = 'remaining_balance'
  ) THEN
    ALTER TABLE loans ADD COLUMN remaining_balance numeric DEFAULT 0 CHECK (remaining_balance >= 0);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'loans' AND column_name = 'next_payment_date'
  ) THEN
    ALTER TABLE loans ADD COLUMN next_payment_date timestamptz;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'loans' AND column_name = 'completion_date'
  ) THEN
    ALTER TABLE loans ADD COLUMN completion_date timestamptz;
  END IF;
END $$;

-- Add missing columns to loan_payments if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'loan_payments' AND column_name = 'customer_id'
  ) THEN
    ALTER TABLE loan_payments ADD COLUMN customer_id uuid REFERENCES customers(id);
  END IF;
END $$;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_loan_payments_customer_loan 
ON loan_payments(customer_id, loan_id);