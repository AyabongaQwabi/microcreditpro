/*
  # Fix Terms Sets RLS Policies

  1. Changes
    - Simplify RLS policies for terms_sets table
    - Ensure proper vendor access for CRUD operations
    - Allow public read access for terms sets
  
  2. Security
    - Maintain proper access control
    - Ensure vendors can only manage their own terms
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Vendors can manage own terms" ON terms_sets;
DROP POLICY IF EXISTS "Anyone can view terms" ON terms_sets;

-- Create new simplified policies
CREATE POLICY "Vendors can manage own terms"
  ON terms_sets
  FOR ALL
  TO authenticated
  USING (
    -- Allow vendors to manage their own terms
    auth.uid() = vendor_id
  )
  WITH CHECK (
    -- Ensure vendors can only create/update their own terms
    auth.uid() = vendor_id
  );

CREATE POLICY "Public read access for terms"
  ON terms_sets
  FOR SELECT
  TO authenticated
  USING (true);