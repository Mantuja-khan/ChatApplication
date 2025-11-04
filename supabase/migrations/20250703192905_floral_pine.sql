/*
  # Add message reactions support

  1. Changes
    - Add reactions column to messages table to store user reactions
    - Reactions stored as JSONB object with user_id as key and emoji as value
*/

-- Add reactions column to messages table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'messages' AND column_name = 'reactions'
  ) THEN
    ALTER TABLE messages ADD COLUMN reactions jsonb DEFAULT '{}';
  END IF;
END $$;

-- Add index for better performance when querying reactions
CREATE INDEX IF NOT EXISTS idx_messages_reactions 
ON messages USING GIN (reactions);