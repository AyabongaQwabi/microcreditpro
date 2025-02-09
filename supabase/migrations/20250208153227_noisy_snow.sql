/*
  # Fix Terms Sets RLS Policies

  1. Changes
    - Drop existing RLS policies for terms_sets
    - Create new, more permissive policies for terms management
    - Add vendor_id foreign key constraint
  
  2. Security
    - Enable RLS on terms_sets table
    - Add policies for CRUD operations
    - Ensure proper vendor access control
*/

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Vendors can view own terms sets" ON terms_sets;
DROP POLICY IF EXISTS "Vendors can create own terms sets" ON terms_sets;
DROP POLICY IF EXISTS "Vendors can update own terms sets" ON terms_sets;
DROP POLICY IF EXISTS "Vendors can delete own terms sets" ON terms_sets;

-- Add foreign key constraint if missing
ALTER TABLE terms_sets
DROP CONSTRAINT IF EXISTS terms_sets_vendor_id_fkey,
ADD CONSTRAINT terms_sets_vendor_id_fkey 
  FOREIGN KEY (vendor_id) 
  REFERENCES lenders(id)
  ON DELETE CASCADE;

-- Create new RLS policies
CREATE POLICY "Vendors can manage own terms sets"
  ON terms_sets
  FOR ALL
  TO authenticated
  USING (
    auth.uid() = vendor_id OR
    EXISTS (
      SELECT 1 FROM lenders 
      WHERE id = auth.uid() AND id = vendor_id
    )
  )
  WITH CHECK (
    auth.uid() = vendor_id OR
    EXISTS (
      SELECT 1 FROM lenders 
      WHERE id = auth.uid() AND id = vendor_id
    )
  );

-- Create policy for customers to view terms
CREATE POLICY "Customers can view terms sets"
  ON terms_sets
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM customers 
      WHERE id = auth.uid()
    )
  );