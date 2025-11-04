/*
  # Add About section to profiles

  1. Changes
    - Add `about` column to profiles table for user bio/thoughts
  2. Notes
    - Uses direct ALTER TABLE statement for better performance
    - Includes comment for documentation
*/

-- Add about column to profiles table
ALTER TABLE IF EXISTS profiles 
ADD COLUMN IF NOT EXISTS about text DEFAULT '';