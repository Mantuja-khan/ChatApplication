/*
  # Add name column to profiles table

  1. Changes
    - Add `name` column to `profiles` table
    - Make it nullable to support existing users
*/

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'name'
  ) THEN
    ALTER TABLE profiles ADD COLUMN name text;
  END IF;
END $$;