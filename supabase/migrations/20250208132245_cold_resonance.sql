/*
  # Create vendor management tables

  1. New Tables
    - `vendor_capital`
      - `id` (uuid, primary key)
      - `vendor_id` (uuid, references lenders)
      - `amount` (numeric)
      - `type` (text: 'deposit' or 'withdrawal')
      - `status` (text)
      - `reference` (text)
      - `created_at` (timestamptz)

    - `loan_offers`
      - `id` (uuid, primary key)
      - `vendor_id` (uuid, references lenders)
      - `name` (text)
      - `min_amount` (numeric)
      - `max_amount` (numeric)
      - `interest_rate` (numeric)
      - `term_months` (integer)
      - `requirements` (text)
      - `status` (text)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `customer_risk_assessments`
      - `id` (uuid, primary key)
      - `customer_id` (uuid, references auth.users)
      - `vendor_id` (uuid, references lenders)
      - `risk_score` (integer)
      - `risk_grade` (text)
      - `assessment_date` (timestamptz)
      - `notes` (text)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Add appropriate policies for data access
*/

-- Create vendor_capital table
CREATE TABLE IF NOT EXISTS vendor_capital (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id uuid REFERENCES lenders NOT NULL,
  amount numeric NOT NULL CHECK (amount > 0),
  type text NOT NULL CHECK (type IN ('deposit', 'withdrawal')),
  status text NOT NULL CHECK (status IN ('pending', 'completed', 'failed')),
  reference text,
  created_at timestamptz DEFAULT now()
);

-- Create loan_offers table
CREATE TABLE IF NOT EXISTS loan_offers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id uuid REFERENCES lenders NOT NULL,
  name text NOT NULL,
  min_amount numeric NOT NULL CHECK (min_amount > 0),
  max_amount numeric NOT NULL CHECK (max_amount > min_amount),
  interest_rate numeric NOT NULL CHECK (interest_rate >= 0),
  term_months integer NOT NULL CHECK (term_months > 0),
  requirements text,
  status text NOT NULL CHECK (status IN ('active', 'inactive', 'draft')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create customer_risk_assessments table
CREATE TABLE IF NOT EXISTS customer_risk_assessments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid REFERENCES auth.users NOT NULL,
  vendor_id uuid REFERENCES lenders NOT NULL,
  risk_score integer NOT NULL CHECK (risk_score >= 0 AND risk_score <= 100),
  risk_grade text NOT NULL CHECK (risk_grade IN ('A', 'B', 'C', 'D', 'E', 'F')),
  assessment_date timestamptz NOT NULL,
  notes text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(customer_id, vendor_id)
);

-- Enable RLS
ALTER TABLE vendor_capital ENABLE ROW LEVEL SECURITY;
ALTER TABLE loan_offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_risk_assessments ENABLE ROW LEVEL SECURITY;

-- Policies for vendor_capital
CREATE POLICY "Vendors can view own capital transactions"
  ON vendor_capital
  FOR SELECT
  TO authenticated
  USING (auth.uid() = vendor_id);

CREATE POLICY "Vendors can insert own capital transactions"
  ON vendor_capital
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = vendor_id);

-- Policies for loan_offers
CREATE POLICY "Anyone can view active loan offers"
  ON loan_offers
  FOR SELECT
  TO authenticated
  USING (status = 'active');

CREATE POLICY "Vendors can view all own loan offers"
  ON loan_offers
  FOR SELECT
  TO authenticated
  USING (auth.uid() = vendor_id);

CREATE POLICY "Vendors can insert own loan offers"
  ON loan_offers
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = vendor_id);

CREATE POLICY "Vendors can update own loan offers"
  ON loan_offers
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = vendor_id)
  WITH CHECK (auth.uid() = vendor_id);

-- Policies for customer_risk_assessments
CREATE POLICY "Vendors can view risk assessments they created"
  ON customer_risk_assessments
  FOR SELECT
  TO authenticated
  USING (auth.uid() = vendor_id);

CREATE POLICY "Vendors can create risk assessments"
  ON customer_risk_assessments
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = vendor_id);

CREATE POLICY "Vendors can update risk assessments they created"
  ON customer_risk_assessments
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = vendor_id)
  WITH CHECK (auth.uid() = vendor_id);

-- Add trigger for updating updated_at
CREATE TRIGGER update_loan_offers_updated_at
  BEFORE UPDATE ON loan_offers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();