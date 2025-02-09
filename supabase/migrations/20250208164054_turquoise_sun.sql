/*
  # Fix Loan Offers RLS Policies

  1. Changes
    - Drop existing problematic policies
    - Add vendor_id foreign key constraint
    - Create new simplified RLS policies for loan offers
    
  2. Security
    - Enable RLS on loan_offers table
    - Add policy for vendors to manage their own offers
    - Add policy for public read access to active offers
*/

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Vendors can view own loan offers" ON loan_offers;
DROP POLICY IF EXISTS "Vendors can create own loan offers" ON loan_offers;
DROP POLICY IF EXISTS "Vendors can update own loan offers" ON loan_offers;
DROP POLICY IF EXISTS "Vendors can delete own loan offers" ON loan_offers;

-- Add foreign key constraint if missing
ALTER TABLE loan_offers
DROP CONSTRAINT IF EXISTS loan_offers_vendor_id_fkey,
ADD CONSTRAINT loan_offers_vendor_id_fkey 
  FOREIGN KEY (vendor_id) 
  REFERENCES lenders(id)
  ON DELETE CASCADE;

-- Create new simplified policies
CREATE POLICY "Vendors can manage own offers"
  ON loan_offers
  FOR ALL
  TO authenticated
  USING (
    -- Allow vendors to manage their own offers
    auth.uid() = vendor_id
  )
  WITH CHECK (
    -- Ensure vendors can only create/update their own offers
    auth.uid() = vendor_id
  );

CREATE POLICY "Public read access for active offers"
  ON loan_offers
  FOR SELECT
  TO authenticated
  USING (
    -- Allow reading all active offers
    status = 'active'
    OR
    -- Or if the user owns the offer
    auth.uid() = vendor_id
  );