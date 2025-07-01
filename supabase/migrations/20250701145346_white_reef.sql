/*
  # Create gallery images table

  1. New Tables
    - `gallery_images`
      - `id` (uuid, primary key)
      - `url` (text, unique)
      - `title` (text)
      - `description` (text)
      - `category` (text)
      - `tags` (text array)
      - `likes` (integer, default 0)
      - `author_id` (uuid, references auth.users)
      - `author_name` (text)
      - `size` (bigint)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on gallery_images table
    - Add policies for authenticated users to manage their own images
    - Add policies for public read access to all images
*/

-- Create gallery_images table
CREATE TABLE IF NOT EXISTS gallery_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  url text UNIQUE NOT NULL,
  title text NOT NULL,
  description text,
  category text NOT NULL DEFAULT 'uncategorized',
  tags text[] DEFAULT '{}',
  likes integer DEFAULT 0,
  author_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  author_name text NOT NULL,
  size bigint DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE gallery_images ENABLE ROW LEVEL SECURITY;

-- Policies for gallery_images
CREATE POLICY "Anyone can read gallery images"
  ON gallery_images
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Users can create their own gallery images"
  ON gallery_images
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Users can update their own gallery images"
  ON gallery_images
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = author_id)
  WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Users can delete their own gallery images"
  ON gallery_images
  FOR DELETE
  TO authenticated
  USING (auth.uid() = author_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_gallery_images_author_id ON gallery_images(author_id);
CREATE INDEX IF NOT EXISTS idx_gallery_images_category ON gallery_images(category);
CREATE INDEX IF NOT EXISTS idx_gallery_images_tags ON gallery_images USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_gallery_images_created_at ON gallery_images(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_gallery_images_url ON gallery_images(url);