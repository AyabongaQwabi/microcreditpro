/*
  # Fix Schema Constraints

  1. Changes
    - Add missing columns to loans table:
      - remaining_balance
      - next_payment_date
      - completion_date
    - Add missing columns to customers table:
      - profile_picture
    - Add missing columns to loan_payments table:
      - customer_id
    - Add missing columns to lender_profiles table:
      - rating

  2. Security
    - Add appropriate constraints and defaults
    - Ensure referential integrity
*/

-- Add missing columns to loans table
ALTER TABLE loans
ADD COLUMN IF NOT EXISTS remaining_balance numeric DEFAULT 0 CHECK (remaining_balance >= 0),
ADD COLUMN IF NOT EXISTS next_payment_date timestamptz,
ADD COLUMN IF NOT EXISTS completion_date timestamptz;

-- Add profile_picture to customers
ALTER TABLE customers
ADD COLUMN IF NOT EXISTS profile_picture text;

-- Add customer_id to loan_payments with proper constraints
ALTER TABLE loan_payments
ADD COLUMN IF NOT EXISTS customer_id uuid REFERENCES customers(id);

-- Create index on (customer_id, loan_id) for better query performance
CREATE INDEX IF NOT EXISTS idx_loan_payments_customer_loan 
ON loan_payments(customer_id, loan_id);

-- Add rating to lenders
ALTER TABLE lenders
ADD COLUMN IF NOT EXISTS rating numeric DEFAULT 0 CHECK (rating >= 0 AND rating <= 5);

-- Create function to calculate remaining balance
CREATE OR REPLACE FUNCTION calculate_remaining_balance()
RETURNS TRIGGER AS $$
BEGIN
  -- For new loans, set remaining balance to loan amount
  IF TG_OP = 'INSERT' THEN
    NEW.remaining_balance := NEW.amount;
  END IF;
  
  -- Ensure remaining balance is never negative
  IF NEW.remaining_balance < 0 THEN
    NEW.remaining_balance := 0;
  END IF;
  
  -- Set completion date when loan is paid
  IF NEW.remaining_balance = 0 AND NEW.status = 'active' THEN
    NEW.status := 'paid';
    NEW.completion_date := CURRENT_TIMESTAMP;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for remaining balance calculation
DROP TRIGGER IF EXISTS calculate_loan_balance ON loans;
CREATE TRIGGER calculate_loan_balance
  BEFORE INSERT OR UPDATE ON loans
  FOR EACH ROW
  EXECUTE FUNCTION calculate_remaining_balance();

-- Create function to update loan payment dates
CREATE OR REPLACE FUNCTION update_loan_payment_dates()
RETURNS TRIGGER AS $$
BEGIN
  -- Set next payment date for new active loans
  IF TG_OP = 'INSERT' AND NEW.status = 'active' THEN
    NEW.next_payment_date := CURRENT_TIMESTAMP + interval '1 month';
  END IF;
  
  -- Update next payment date when payment is made
  IF TG_OP = 'UPDATE' AND NEW.status = 'active' AND OLD.remaining_balance > NEW.remaining_balance THEN
    NEW.next_payment_date := CURRENT_TIMESTAMP + interval '1 month';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for payment date updates
DROP TRIGGER IF EXISTS update_loan_dates ON loans;
CREATE TRIGGER update_loan_dates
  BEFORE INSERT OR UPDATE ON loans
  FOR EACH ROW
  EXECUTE FUNCTION update_loan_payment_dates();

-- Create function to calculate lender rating
CREATE OR REPLACE FUNCTION calculate_lender_rating()
RETURNS TRIGGER AS $$
BEGIN
  -- Update lender rating when a review is added/updated/deleted
  WITH avg_rating AS (
    SELECT AVG(rating)::numeric(3,2) as rating
    FROM lender_reviews
    WHERE lender_id = COALESCE(NEW.lender_id, OLD.lender_id)
  )
  UPDATE lenders
  SET rating = COALESCE((SELECT rating FROM avg_rating), 0)
  WHERE id = COALESCE(NEW.lender_id, OLD.lender_id);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for rating calculation
DROP TRIGGER IF EXISTS calculate_rating_on_review ON lender_reviews;
CREATE TRIGGER calculate_rating_on_review
  AFTER INSERT OR UPDATE OR DELETE ON lender_reviews
  FOR EACH ROW
  EXECUTE FUNCTION calculate_lender_rating();