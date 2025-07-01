/*
  # Create blog tables

  1. New Tables
    - `blog_posts`
      - `id` (uuid, primary key)
      - `title` (text, required)
      - `content` (text, required)
      - `excerpt` (text)
      - `featured_image` (text)
      - `custom_icon` (text)
      - `author_id` (uuid, references auth.users)
      - `author_name` (text)
      - `author_avatar` (text)
      - `published_at` (timestamptz)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
      - `read_time` (integer)
      - `likes` (integer, default 0)
      - `comments` (integer, default 0)
      - `tags` (text array)
      - `status` (text, check constraint)
      - `revision_history` (jsonb)

    - `blog_tags`
      - `id` (uuid, primary key)
      - `name` (text, unique)
      - `color` (text)
      - `category` (text)
      - `post_count` (integer, default 0)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on both tables
    - Add policies for authenticated users to manage their own posts
    - Add policies for public read access to published posts
*/

-- Create blog_posts table
CREATE TABLE IF NOT EXISTS blog_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  content text NOT NULL,
  excerpt text,
  featured_image text,
  custom_icon text,
  author_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  author_name text NOT NULL,
  author_avatar text,
  published_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  read_time integer DEFAULT 1,
  likes integer DEFAULT 0,
  comments integer DEFAULT 0,
  tags text[] DEFAULT '{}',
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  revision_history jsonb DEFAULT '[]'::jsonb
);

-- Create blog_tags table
CREATE TABLE IF NOT EXISTS blog_tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  color text NOT NULL DEFAULT '#93E1D8',
  category text,
  post_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_tags ENABLE ROW LEVEL SECURITY;

-- Policies for blog_posts
CREATE POLICY "Anyone can read published posts"
  ON blog_posts
  FOR SELECT
  USING (status = 'published');

CREATE POLICY "Users can read their own posts"
  ON blog_posts
  FOR SELECT
  TO authenticated
  USING (auth.uid() = author_id);

CREATE POLICY "Users can create their own posts"
  ON blog_posts
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Users can update their own posts"
  ON blog_posts
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = author_id)
  WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Users can delete their own posts"
  ON blog_posts
  FOR DELETE
  TO authenticated
  USING (auth.uid() = author_id);

-- Policies for blog_tags
CREATE POLICY "Anyone can read tags"
  ON blog_tags
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Authenticated users can create tags"
  ON blog_tags
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update tags"
  ON blog_tags
  FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can delete tags"
  ON blog_tags
  FOR DELETE
  TO authenticated
  USING (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_blog_posts_status ON blog_posts(status);
CREATE INDEX IF NOT EXISTS idx_blog_posts_author_id ON blog_posts(author_id);
CREATE INDEX IF NOT EXISTS idx_blog_posts_published_at ON blog_posts(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_blog_posts_tags ON blog_posts USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_blog_tags_name ON blog_tags(name);

-- Function to update post count for tags
CREATE OR REPLACE FUNCTION update_tag_post_counts()
RETURNS void AS $$
BEGIN
  UPDATE blog_tags 
  SET post_count = (
    SELECT COUNT(*)
    FROM blog_posts 
    WHERE status = 'published' 
    AND blog_tags.name = ANY(blog_posts.tags)
  );
END;
$$ LANGUAGE plpgsql;

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_blog_posts_updated_at
  BEFORE UPDATE ON blog_posts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();