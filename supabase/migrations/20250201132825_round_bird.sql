/*
  # Add image support to messages

  1. Changes
    - Add `type` column to messages table to distinguish between text and image messages
    - Add `image_url` column to messages table to store image URLs
    - Create storage bucket for message images
    - Add storage policies for image uploads

  2. Security
    - Enable public access to message images
    - Allow authenticated users to upload images
*/

-- Add message type and image URL columns
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'messages' AND column_name = 'type'
  ) THEN
    ALTER TABLE messages ADD COLUMN type text DEFAULT 'text';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'messages' AND column_name = 'image_url'
  ) THEN
    ALTER TABLE messages ADD COLUMN image_url text;
  END IF;
END $$;

-- Create storage bucket for message images
INSERT INTO storage.buckets (id, name, public)
VALUES ('message-images', 'message-images', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for message images
CREATE POLICY "Message images are publicly accessible"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'message-images');

CREATE POLICY "Users can upload message images"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'message-images' AND
    auth.role() = 'authenticated'
  );