/*
  # Create loan management tables

  1. New Tables
    - `loans`
      - `id` (uuid, primary key)
      - `customer_id` (uuid, references auth.users)
      - `lender_id` (uuid, references lenders)
      - `amount` (numeric)
      - `interest_rate` (numeric)
      - `term_months` (integer)
      - `status` (text)
      - `start_date` (timestamptz)
      - `end_date` (timestamptz)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `loan_payments`
      - `id` (uuid, primary key)
      - `loan_id` (uuid, references loans)
      - `amount` (numeric)
      - `payment_date` (timestamptz)
      - `status` (text)
      - `receipt_number` (text)
      - `created_at` (timestamptz)

    - `lender_reviews`
      - `id` (uuid, primary key)
      - `customer_id` (uuid, references auth.users)
      - `lender_id` (uuid, references lenders)
      - `rating` (integer)
      - `comment` (text)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Add appropriate policies for data access
*/

-- Create loans table
CREATE TABLE IF NOT EXISTS loans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid REFERENCES auth.users NOT NULL,
  lender_id uuid REFERENCES lenders NOT NULL,
  amount numeric NOT NULL CHECK (amount > 0),
  interest_rate numeric NOT NULL CHECK (interest_rate >= 0),
  term_months integer NOT NULL CHECK (term_months > 0),
  status text NOT NULL CHECK (status IN ('pending', 'active', 'paid', 'overdue', 'cancelled')),
  start_date timestamptz,
  end_date timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create loan_payments table
CREATE TABLE IF NOT EXISTS loan_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  loan_id uuid REFERENCES loans NOT NULL,
  amount numeric NOT NULL CHECK (amount > 0),
  payment_date timestamptz NOT NULL,
  status text NOT NULL CHECK (status IN ('pending', 'completed', 'failed')),
  receipt_number text,
  created_at timestamptz DEFAULT now()
);

-- Create lender_reviews table
CREATE TABLE IF NOT EXISTS lender_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid REFERENCES auth.users NOT NULL,
  lender_id uuid REFERENCES lenders NOT NULL,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(customer_id, lender_id)
);

-- Enable RLS
ALTER TABLE loans ENABLE ROW LEVEL SECURITY;
ALTER TABLE loan_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE lender_reviews ENABLE ROW LEVEL SECURITY;

-- Policies for loans
CREATE POLICY "Customers can view own loans"
  ON loans
  FOR SELECT
  TO authenticated
  USING (auth.uid() = customer_id);

CREATE POLICY "Lenders can view loans they issued"
  ON loans
  FOR SELECT
  TO authenticated
  USING (auth.uid() = lender_id);

-- Policies for loan_payments
CREATE POLICY "Customers can view payments for their loans"
  ON loan_payments
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM loans
      WHERE loans.id = loan_payments.loan_id
      AND loans.customer_id = auth.uid()
    )
  );

CREATE POLICY "Lenders can view payments for loans they issued"
  ON loan_payments
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM loans
      WHERE loans.id = loan_payments.loan_id
      AND loans.lender_id = auth.uid()
    )
  );

-- Policies for lender_reviews
CREATE POLICY "Anyone can view lender reviews"
  ON lender_reviews
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Customers can create reviews"
  ON lender_reviews
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = customer_id);

CREATE POLICY "Customers can update own reviews"
  ON lender_reviews
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = customer_id)
  WITH CHECK (auth.uid() = customer_id);

-- Add trigger for updating updated_at
CREATE TRIGGER update_loans_updated_at
  BEFORE UPDATE ON loans
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();