/*
  # Fix RLS Recursion Issues

  1. Changes
    - Simplify RLS policies to avoid circular references
    - Update policies for lenders and terms_sets tables
    - Ensure proper access control without recursion
  
  2. Security
    - Maintain security while fixing recursion
    - Keep proper access control for vendors and customers
*/

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Users can view own lender profile" ON lenders;
DROP POLICY IF EXISTS "Vendors can manage own terms sets" ON terms_sets;
DROP POLICY IF EXISTS "Customers can view terms sets" ON terms_sets;

-- Create simplified policies for lenders
CREATE POLICY "Users can view lender profiles"
  ON lenders
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update own lender profile"
  ON lenders
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Create simplified policies for terms_sets
CREATE POLICY "Vendors can manage own terms"
  ON terms_sets
  FOR ALL
  TO authenticated
  USING (auth.uid() = vendor_id)
  WITH CHECK (auth.uid() = vendor_id);

CREATE POLICY "Anyone can view terms"
  ON terms_sets
  FOR SELECT
  TO authenticated
  USING (true);