/*
  # Create user favorites and comments system

  1. New Tables
    - `user_favorites`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `item_type` (text, 'gallery' or 'blog')
      - `item_id` (uuid)
      - `created_at` (timestamptz)

    - `blog_comments`
      - `id` (uuid, primary key)
      - `blog_post_id` (uuid, references blog_posts)
      - `user_id` (uuid, references auth.users)
      - `user_name` (text)
      - `user_avatar` (text)
      - `content` (text)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `gallery_comments`
      - `id` (uuid, primary key)
      - `gallery_image_id` (uuid, references gallery_images)
      - `user_id` (uuid, references auth.users)
      - `user_name` (text)
      - `user_avatar` (text)
      - `content` (text)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Add policies for users to manage their own favorites and comments
    - Add policies for public read access to comments
*/

-- Create user_favorites table
CREATE TABLE IF NOT EXISTS user_favorites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  item_type text NOT NULL CHECK (item_type IN ('gallery', 'blog')),
  item_id uuid NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, item_type, item_id)
);

-- Create blog_comments table
CREATE TABLE IF NOT EXISTS blog_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  blog_post_id uuid REFERENCES blog_posts(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  user_name text NOT NULL,
  user_avatar text,
  content text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create gallery_comments table
CREATE TABLE IF NOT EXISTS gallery_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  gallery_image_id uuid REFERENCES gallery_images(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  user_name text NOT NULL,
  user_avatar text,
  content text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE user_favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE gallery_comments ENABLE ROW LEVEL SECURITY;

-- Policies for user_favorites
CREATE POLICY "Users can read their own favorites"
  ON user_favorites
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own favorites"
  ON user_favorites
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own favorites"
  ON user_favorites
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Policies for blog_comments
CREATE POLICY "Anyone can read blog comments"
  ON blog_comments
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Users can create blog comments"
  ON blog_comments
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own blog comments"
  ON blog_comments
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own blog comments"
  ON blog_comments
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Policies for gallery_comments
CREATE POLICY "Anyone can read gallery comments"
  ON gallery_comments
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Users can create gallery comments"
  ON gallery_comments
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own gallery comments"
  ON gallery_comments
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own gallery comments"
  ON gallery_comments
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_favorites_user_id ON user_favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_user_favorites_item_type ON user_favorites(item_type);
CREATE INDEX IF NOT EXISTS idx_user_favorites_item_id ON user_favorites(item_id);

CREATE INDEX IF NOT EXISTS idx_blog_comments_blog_post_id ON blog_comments(blog_post_id);
CREATE INDEX IF NOT EXISTS idx_blog_comments_user_id ON blog_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_blog_comments_created_at ON blog_comments(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_gallery_comments_gallery_image_id ON gallery_comments(gallery_image_id);
CREATE INDEX IF NOT EXISTS idx_gallery_comments_user_id ON gallery_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_gallery_comments_created_at ON gallery_comments(created_at DESC);

-- Function to update comment updated_at timestamp
CREATE OR REPLACE FUNCTION update_comment_updated_at()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Triggers for updating updated_at
CREATE TRIGGER update_blog_comments_updated_at
  BEFORE UPDATE ON blog_comments
  FOR EACH ROW
  EXECUTE FUNCTION update_comment_updated_at();

CREATE TRIGGER update_gallery_comments_updated_at
  BEFORE UPDATE ON gallery_comments
  FOR EACH ROW
  EXECUTE FUNCTION update_comment_updated_at();

-- Function to get user's favorite items
CREATE OR REPLACE FUNCTION get_user_favorites(user_uuid uuid, favorite_type text DEFAULT NULL)
RETURNS TABLE (
  id uuid,
  item_type text,
  item_id uuid,
  created_at timestamptz
)
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF favorite_type IS NULL THEN
    RETURN QUERY
    SELECT uf.id, uf.item_type, uf.item_id, uf.created_at
    FROM user_favorites uf
    WHERE uf.user_id = user_uuid
    ORDER BY uf.created_at DESC;
  ELSE
    RETURN QUERY
    SELECT uf.id, uf.item_type, uf.item_id, uf.created_at
    FROM user_favorites uf
    WHERE uf.user_id = user_uuid AND uf.item_type = favorite_type
    ORDER BY uf.created_at DESC;
  END IF;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_user_favorites(uuid, text) TO authenticated;