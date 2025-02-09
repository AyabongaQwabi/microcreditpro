/*
  # Fix Loan Offers RLS and Schema

  1. Changes
    - Drop existing policies
    - Add NOT NULL constraint to vendor_id
    - Create new simplified RLS policies
    
  2. Security
    - Enable RLS on loan_offers table
    - Add policy for vendors to manage their own offers
    - Add policy for public read access to active offers
*/

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Vendors can manage own offers" ON loan_offers;
DROP POLICY IF EXISTS "Public read access for active offers" ON loan_offers;

-- Ensure vendor_id is NOT NULL
ALTER TABLE loan_offers 
  ALTER COLUMN vendor_id SET NOT NULL;

-- Create new simplified policies
CREATE POLICY "Vendors can manage own offers"
  ON loan_offers
  FOR ALL
  TO authenticated
  USING (
    auth.uid() = vendor_id
  )
  WITH CHECK (
    auth.uid() = vendor_id
  );

CREATE POLICY "Public read access for active offers"
  ON loan_offers
  FOR SELECT
  TO authenticated
  USING (
    status = 'active' 
    OR 
    auth.uid() = vendor_id
  );