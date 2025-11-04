/*
  # Add hidden_contacts column to profiles table

  1. Changes
    - Add hidden_contacts column to profiles table to store array of hidden contact IDs
    - Add index on hidden_contacts for better query performance
  
  2. Security
    - No additional RLS policies needed as existing profile policies cover this column
*/

-- Add hidden_contacts column to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS hidden_contacts uuid[] DEFAULT '{}';

-- Add index for better performance when querying hidden contacts
CREATE INDEX IF NOT EXISTS idx_profiles_hidden_contacts 
ON profiles USING GIN (hidden_contacts);

-- Update existing RLS policies to ensure they work with the new column
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
CREATE POLICY "Users can update their own profile"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);