/*
  # Add message status columns
  
  1. Changes
    - Add is_delivered column to messages table
    - Add is_seen column to messages table
  
  2. Default Values
    - Both columns default to false
*/

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'messages' AND column_name = 'is_delivered'
  ) THEN
    ALTER TABLE messages ADD COLUMN is_delivered boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'messages' AND column_name = 'is_seen'
  ) THEN
    ALTER TABLE messages ADD COLUMN is_seen boolean DEFAULT false;
  END IF;
END $$;