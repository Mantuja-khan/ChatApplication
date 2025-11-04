/*
  # Account Deletion Cleanup

  1. New Function
    - Creates a function to clean up deleted user data
    - Removes all user data when account is marked as deleted
    - Keeps minimal audit trail

  2. Changes
    - Adds active status column to profiles
    - Adds deleted_at column to profiles
    - Creates cleanup function and trigger
*/

-- Add new columns to profiles if they don't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'active'
  ) THEN
    ALTER TABLE profiles ADD COLUMN active boolean DEFAULT true;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'deleted_at'
  ) THEN
    ALTER TABLE profiles ADD COLUMN deleted_at timestamptz;
  END IF;
END $$;

-- Create function to handle account deletion cleanup
CREATE OR REPLACE FUNCTION handle_account_deletion()
RETURNS trigger AS $$
BEGIN
  -- If the account is marked as deleted
  IF NEW.raw_user_meta_data->>'deleted' = 'true' THEN
    -- Update profile
    UPDATE profiles
    SET 
      name = 'V-Chat User',
      avatar_url = NULL,
      about = NULL,
      active = false,
      deleted_at = CURRENT_TIMESTAMP
    WHERE id = NEW.id;

    -- Delete all messages
    DELETE FROM messages 
    WHERE sender_id = NEW.id OR receiver_id = NEW.id;

    -- Delete all message deletions
    DELETE FROM message_deletions 
    WHERE user_id = NEW.id;

    -- Remove files from storage
    -- Note: This requires manual cleanup through application code
    -- as we can't directly access storage from triggers
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for account deletion
DROP TRIGGER IF EXISTS on_account_deletion ON auth.users;
CREATE TRIGGER on_account_deletion
  AFTER UPDATE ON auth.users
  FOR EACH ROW
  WHEN (NEW.raw_user_meta_data->>'deleted' = 'true')
  EXECUTE FUNCTION handle_account_deletion();