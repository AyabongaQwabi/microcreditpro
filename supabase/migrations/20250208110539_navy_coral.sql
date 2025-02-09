/*
  # Create lenders and customers tables

  1. New Tables
    - `lenders`
      - `id` (uuid, primary key, references auth.users)
      - `business_name` (text)
      - `contact_name` (text)
      - `phone` (text)
      - `address` (text)
      - `business_license` (text)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

    - `customers`
      - `id` (uuid, primary key, references auth.users)
      - `full_name` (text)
      - `phone` (text)
      - `address` (text)
      - `employment_status` (text)
      - `monthly_income` (numeric)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on both tables
    - Add policies for authenticated users to read and update their own data
*/

-- Create lenders table
CREATE TABLE IF NOT EXISTS lenders (
  id uuid PRIMARY KEY REFERENCES auth.users,
  business_name text NOT NULL,
  contact_name text NOT NULL,
  phone text NOT NULL,
  address text NOT NULL,
  business_license text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create customers table
CREATE TABLE IF NOT EXISTS customers (
  id uuid PRIMARY KEY REFERENCES auth.users,
  full_name text NOT NULL,
  phone text NOT NULL,
  address text NOT NULL,
  employment_status text NOT NULL,
  monthly_income numeric NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE lenders ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

-- Policies for lenders
CREATE POLICY "Lenders can read own data"
  ON lenders
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Lenders can update own data"
  ON lenders
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Lenders can insert own data"
  ON lenders
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Policies for customers
CREATE POLICY "Customers can read own data"
  ON customers
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Customers can update own data"
  ON customers
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Customers can insert own data"
  ON customers
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);