/*
  # Fix message deletions RLS policies

  1. Changes
    - Drop existing RLS policies for message_deletions table
    - Add new comprehensive RLS policies that properly handle message deletions
  
  2. Security
    - Users can only delete messages they sent or received
    - Users can view their own message deletions
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own message deletions" ON message_deletions;
DROP POLICY IF EXISTS "Users can delete their own messages" ON message_deletions;

-- Create new policies
CREATE POLICY "Users can view their own message deletions"
  ON message_deletions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete messages they're involved in"
  ON message_deletions
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM messages m
      WHERE m.id = message_id
      AND (m.sender_id = auth.uid() OR m.receiver_id = auth.uid())
    )
  );

CREATE POLICY "Users can update their own message deletions"
  ON message_deletions
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);