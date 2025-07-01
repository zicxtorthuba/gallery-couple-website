/*
  # Create user uploads tracking table

  1. New Tables
    - `user_uploads`
      - `id` (uuid, primary key)
      - `url` (text, unique)
      - `filename` (text)
      - `size` (bigint)
      - `user_id` (uuid, references auth.users)
      - `type` (text, check constraint)
      - `associated_id` (text, optional)
      - `uploaded_at` (timestamptz)

  2. Security
    - Enable RLS on `user_uploads` table
    - Add policies for users to manage their own uploads
*/

-- Create user_uploads table
CREATE TABLE IF NOT EXISTS user_uploads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  url text UNIQUE NOT NULL,
  filename text NOT NULL,
  size bigint NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('gallery', 'blog')),
  associated_id text,
  uploaded_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE user_uploads ENABLE ROW LEVEL SECURITY;

-- Policies for user_uploads
CREATE POLICY "Users can read their own uploads"
  ON user_uploads
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own uploads"
  ON user_uploads
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own uploads"
  ON user_uploads
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own uploads"
  ON user_uploads
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_uploads_user_id ON user_uploads(user_id);
CREATE INDEX IF NOT EXISTS idx_user_uploads_type ON user_uploads(type);
CREATE INDEX IF NOT EXISTS idx_user_uploads_url ON user_uploads(url);
CREATE INDEX IF NOT EXISTS idx_user_uploads_uploaded_at ON user_uploads(uploaded_at DESC);

-- Function to get user storage usage
CREATE OR REPLACE FUNCTION get_user_storage_usage(user_uuid uuid)
RETURNS bigint AS $$
BEGIN
  RETURN COALESCE(
    (SELECT SUM(size) FROM user_uploads WHERE user_id = user_uuid),
    0
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;