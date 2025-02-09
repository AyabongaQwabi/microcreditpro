/*
  # Create physical addresses table

  1. New Tables
    - `physical_addresses`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `house_number` (text)
      - `street_name` (text)
      - `zone_name` (text)
      - `suburb_name` (text)
      - `town` (text)
      - `postal_code` (text)
      - `province` (text)
      - `country` (text)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `physical_addresses` table
    - Add policies for authenticated users to:
      - Insert their own address
      - Read their own address
      - Update their own address
*/

CREATE TABLE IF NOT EXISTS physical_addresses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  house_number text NOT NULL,
  street_name text NOT NULL,
  zone_name text NOT NULL,
  suburb_name text NOT NULL,
  town text NOT NULL,
  postal_code text NOT NULL,
  province text NOT NULL,
  country text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE physical_addresses ENABLE ROW LEVEL SECURITY;

-- Policies for physical_addresses
CREATE POLICY "Users can read own physical address"
  ON physical_addresses
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own physical address"
  ON physical_addresses
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own physical address"
  ON physical_addresses
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Add a trigger to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_physical_addresses_updated_at
  BEFORE UPDATE ON physical_addresses
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();