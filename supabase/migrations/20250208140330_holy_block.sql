/*
  # Add Loan Terms Management Tables

  1. New Tables
    - `terms_sets`: Stores predefined sets of terms and conditions
      - `id` (uuid, primary key)
      - `vendor_id` (uuid, references lenders)
      - `name` (text)
      - `category` (text)
      - `content` (text)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Changes to Existing Tables
    - Add `terms_sets` and `custom_terms` columns to `loan_offers` table

  3. Security
    - Enable RLS on new tables
    - Add policies for vendor access
*/

-- Create terms_sets table
CREATE TABLE IF NOT EXISTS terms_sets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id uuid REFERENCES lenders(id) NOT NULL,
  name text NOT NULL,
  category text NOT NULL,
  content text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add terms columns to loan_offers
ALTER TABLE loan_offers
ADD COLUMN IF NOT EXISTS terms_sets uuid[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS custom_terms text DEFAULT '';

-- Enable RLS
ALTER TABLE terms_sets ENABLE ROW LEVEL SECURITY;

-- Policies for terms_sets
CREATE POLICY "Vendors can view own terms sets"
  ON terms_sets
  FOR SELECT
  TO authenticated
  USING (auth.uid() = vendor_id);

CREATE POLICY "Vendors can create own terms sets"
  ON terms_sets
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = vendor_id);

CREATE POLICY "Vendors can update own terms sets"
  ON terms_sets
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = vendor_id)
  WITH CHECK (auth.uid() = vendor_id);

CREATE POLICY "Vendors can delete own terms sets"
  ON terms_sets
  FOR DELETE
  TO authenticated
  USING (auth.uid() = vendor_id);

-- Add trigger for updating updated_at
CREATE TRIGGER update_terms_sets_updated_at
  BEFORE UPDATE ON terms_sets
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();