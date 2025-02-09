/*
  # Add deleted loan offers table
  
  1. New Tables
    - `deleted_loan_offers`
      - `id` (uuid, primary key)
      - `original_id` (uuid)
      - `vendor_id` (uuid, references lenders)
      - `name` (text)
      - `min_amount` (numeric)
      - `max_amount` (numeric)
      - `interest_rate` (numeric)
      - `term_months` (integer)
      - `terms_sets` (uuid[])
      - `custom_terms` (text)
      - `deletion_reason` (text)
      - `original_created_at` (timestamptz)
      - `deleted_at` (timestamptz)

  2. Security
    - Enable RLS
    - Add policy for vendors to view their own deleted offers
*/

-- Create deleted_loan_offers table
CREATE TABLE IF NOT EXISTS deleted_loan_offers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  original_id uuid NOT NULL,
  vendor_id uuid REFERENCES lenders(id) NOT NULL,
  name text NOT NULL,
  min_amount numeric NOT NULL CHECK (min_amount > 0),
  max_amount numeric NOT NULL CHECK (max_amount > min_amount),
  interest_rate numeric NOT NULL CHECK (interest_rate >= 0 AND interest_rate <= 100),
  term_months integer NOT NULL CHECK (term_months >= 1 AND term_months <= 6),
  terms_sets uuid[] DEFAULT '{}',
  custom_terms text DEFAULT '',
  deletion_reason text,
  original_created_at timestamptz NOT NULL,
  deleted_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE deleted_loan_offers ENABLE ROW LEVEL SECURITY;

-- Create policy for vendors to view their own deleted offers
CREATE POLICY "Vendors can view own deleted offers"
  ON deleted_loan_offers
  FOR SELECT
  TO authenticated
  USING (auth.uid() = vendor_id);

-- Create index for better query performance
CREATE INDEX idx_deleted_loan_offers_vendor_id ON deleted_loan_offers(vendor_id);
CREATE INDEX idx_deleted_loan_offers_original_id ON deleted_loan_offers(original_id);