/*
  # Fix loan offers constraints

  1. Changes
    - Add proper check constraints for loan offers table
    - Ensure all numeric fields have appropriate ranges
    - Add validation for status values

  2. Security
    - Maintain existing RLS policies
    - No changes to access control
*/

-- Drop existing check constraints if they exist
ALTER TABLE loan_offers
DROP CONSTRAINT IF EXISTS loan_offers_min_amount_check,
DROP CONSTRAINT IF EXISTS loan_offers_max_amount_check,
DROP CONSTRAINT IF EXISTS loan_offers_interest_rate_check,
DROP CONSTRAINT IF EXISTS loan_offers_term_months_check,
DROP CONSTRAINT IF EXISTS loan_offers_status_check;

-- Add proper check constraints
ALTER TABLE loan_offers
ADD CONSTRAINT loan_offers_min_amount_check 
  CHECK (min_amount > 0),
ADD CONSTRAINT loan_offers_max_amount_check 
  CHECK (max_amount > min_amount),
ADD CONSTRAINT loan_offers_interest_rate_check 
  CHECK (interest_rate >= 0 AND interest_rate <= 100),
ADD CONSTRAINT loan_offers_term_months_check 
  CHECK (term_months >= 1 AND term_months <= 6),
ADD CONSTRAINT loan_offers_status_check 
  CHECK (status IN ('active', 'inactive', 'draft'));