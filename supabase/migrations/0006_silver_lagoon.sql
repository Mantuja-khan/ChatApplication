/*
  # Add delete policy for messages

  1. Changes
    - Add policy to allow users to delete their messages
  
  2. Security
    - Users can only delete messages where they are either the sender or receiver
*/

CREATE POLICY "Users can delete their messages"
  ON messages
  FOR DELETE
  TO authenticated
  USING (
    auth.uid() = sender_id OR
    auth.uid() = receiver_id
  );