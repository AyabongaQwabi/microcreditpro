/*
  # Add bank account details

  1. New Tables
    - `bank_accounts`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `account_holder` (text)
      - `account_number` (text)
      - `bank_name` (text)
      - `branch_code` (text)
      - `account_type` (text)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `bank_accounts` table
    - Add policies for authenticated users to manage their own data
*/

CREATE TABLE IF NOT EXISTS bank_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  account_holder text NOT NULL,
  account_number text NOT NULL,
  bank_name text NOT NULL,
  branch_code text NOT NULL,
  account_type text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE bank_accounts ENABLE ROW LEVEL SECURITY;

-- Policies for bank_accounts
CREATE POLICY "Users can read own bank account"
  ON bank_accounts
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own bank account"
  ON bank_accounts
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own bank account"
  ON bank_accounts
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);