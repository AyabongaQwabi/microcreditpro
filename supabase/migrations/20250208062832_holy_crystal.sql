/*
  # Create Beta Signups Table

  1. New Tables
    - `beta_signups`
      - `id` (uuid, primary key)
      - `full_name` (text, required)
      - `email` (text, required, unique)
      - `phone` (text, required)
      - `created_at` (timestamptz, default: now())

  2. Security
    - Enable RLS on `beta_signups` table
    - Add policy for inserting new signups
*/

CREATE TABLE IF NOT EXISTS beta_signups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  email text NOT NULL UNIQUE,
  phone text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE beta_signups ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert new beta signups
CREATE POLICY "Anyone can insert beta signups"
  ON beta_signups
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Only authenticated users can view beta signups
CREATE POLICY "Only authenticated users can view beta signups"
  ON beta_signups
  FOR SELECT
  TO authenticated
  USING (true);