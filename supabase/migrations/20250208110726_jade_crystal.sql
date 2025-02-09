/*
  # Add South African ID number to customers table

  1. Changes
    - Add `sa_id_number` column to customers table
    - Add validation check for SA ID number format (13 digits)

  2. Security
    - Maintain existing RLS policies
*/

ALTER TABLE customers 
ADD COLUMN IF NOT EXISTS sa_id_number text NOT NULL;

-- Add constraint to ensure SA ID number is exactly 13 digits
ALTER TABLE customers 
ADD CONSTRAINT valid_sa_id_number 
CHECK (sa_id_number ~ '^[0-9]{13}$');