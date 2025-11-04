/*
  # Add message deletion functionality

  1. New Tables
    - `message_deletions`: Tracks which messages are deleted for specific users
      - `id` (uuid, primary key)
      - `message_id` (uuid, references messages)
      - `user_id` (uuid, references profiles)
      - `created_at` (timestamptz)

  2. Changes
    - Add `deleted_for_everyone` column to messages table

  3. Security
    - Enable RLS on message_deletions table
    - Add policies for message deletion management
*/

-- Add deleted_for_everyone to messages if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'messages' AND column_name = 'deleted_for_everyone'
  ) THEN
    ALTER TABLE messages ADD COLUMN deleted_for_everyone boolean DEFAULT false;
  END IF;
END $$;

-- Create message_deletions table
CREATE TABLE IF NOT EXISTS message_deletions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id uuid REFERENCES messages(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(message_id, user_id)
);

-- Enable RLS
ALTER TABLE message_deletions ENABLE ROW LEVEL SECURITY;

-- Policies for message_deletions
CREATE POLICY "Users can view their own message deletions"
  ON message_deletions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own messages"
  ON message_deletions
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Update messages policies to handle deletion
CREATE POLICY "Users can update their own sent messages"
  ON messages
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = sender_id);