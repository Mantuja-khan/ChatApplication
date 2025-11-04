/*
  # Add blocked_users to profiles table

  1. Changes
    - Add blocked_users array column to profiles table
    - Add index for better performance when querying blocked users
*/

-- Add blocked_users column to profiles table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'blocked_users'
  ) THEN
    ALTER TABLE profiles ADD COLUMN blocked_users uuid[] DEFAULT '{}';
  END IF;
END $$;

-- Add index for better performance when querying blocked users
CREATE INDEX IF NOT EXISTS idx_profiles_blocked_users 
ON profiles USING GIN (blocked_users);