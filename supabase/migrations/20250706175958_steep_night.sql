/*
  # Create albums system

  1. New Tables
    - `albums`
      - `id` (uuid, primary key)
      - `name` (text, required)
      - `description` (text)
      - `cover_image` (text)
      - `author_id` (uuid, references auth.users)
      - `author_name` (text)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
      - `image_count` (integer, default 0)
      - `is_public` (boolean, default true)

    - `album_images`
      - `id` (uuid, primary key)
      - `album_id` (uuid, references albums)
      - `image_id` (uuid, references gallery_images)
      - `position` (integer)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on both tables
    - Add policies for users to manage their own albums
    - Add policies for public read access to public albums
*/

-- Create albums table
CREATE TABLE IF NOT EXISTS albums (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  cover_image text,
  author_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  author_name text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  image_count integer DEFAULT 0,
  is_public boolean DEFAULT true
);

-- Create album_images table (junction table)
CREATE TABLE IF NOT EXISTS album_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  album_id uuid REFERENCES albums(id) ON DELETE CASCADE,
  image_id uuid REFERENCES gallery_images(id) ON DELETE CASCADE,
  position integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  UNIQUE(album_id, image_id)
);

-- Enable RLS
ALTER TABLE albums ENABLE ROW LEVEL SECURITY;
ALTER TABLE album_images ENABLE ROW LEVEL SECURITY;

-- Policies for albums
CREATE POLICY "Anyone can read public albums"
  ON albums
  FOR SELECT
  USING (is_public = true);

CREATE POLICY "Users can read their own albums"
  ON albums
  FOR SELECT
  TO authenticated
  USING (auth.uid() = author_id);

CREATE POLICY "Users can create their own albums"
  ON albums
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Users can update their own albums"
  ON albums
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = author_id)
  WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Users can delete their own albums"
  ON albums
  FOR DELETE
  TO authenticated
  USING (auth.uid() = author_id);

-- Policies for album_images
CREATE POLICY "Anyone can read album images for public albums"
  ON album_images
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM albums 
      WHERE albums.id = album_images.album_id 
      AND albums.is_public = true
    )
  );

CREATE POLICY "Users can read their own album images"
  ON album_images
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM albums 
      WHERE albums.id = album_images.album_id 
      AND albums.author_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage their own album images"
  ON album_images
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM albums 
      WHERE albums.id = album_images.album_id 
      AND albums.author_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM albums 
      WHERE albums.id = album_images.album_id 
      AND albums.author_id = auth.uid()
    )
  );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_albums_author_id ON albums(author_id);
CREATE INDEX IF NOT EXISTS idx_albums_created_at ON albums(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_albums_is_public ON albums(is_public);
CREATE INDEX IF NOT EXISTS idx_album_images_album_id ON album_images(album_id);
CREATE INDEX IF NOT EXISTS idx_album_images_image_id ON album_images(image_id);
CREATE INDEX IF NOT EXISTS idx_album_images_position ON album_images(album_id, position);

-- Function to update album image count
CREATE OR REPLACE FUNCTION update_album_image_count()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE albums 
    SET image_count = image_count + 1,
        updated_at = now()
    WHERE id = NEW.album_id;
    
    -- Set as cover image if it's the first image
    UPDATE albums 
    SET cover_image = (
      SELECT gi.url 
      FROM gallery_images gi 
      WHERE gi.id = NEW.image_id
    )
    WHERE id = NEW.album_id 
    AND cover_image IS NULL;
    
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE albums 
    SET image_count = image_count - 1,
        updated_at = now()
    WHERE id = OLD.album_id;
    
    -- Update cover image if the deleted image was the cover
    UPDATE albums 
    SET cover_image = (
      SELECT gi.url 
      FROM album_images ai
      JOIN gallery_images gi ON gi.id = ai.image_id
      WHERE ai.album_id = OLD.album_id
      ORDER BY ai.position ASC
      LIMIT 1
    )
    WHERE id = OLD.album_id 
    AND cover_image = (
      SELECT gi.url 
      FROM gallery_images gi 
      WHERE gi.id = OLD.image_id
    );
    
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

-- Trigger to update album image count
CREATE TRIGGER update_album_image_count_trigger
  AFTER INSERT OR DELETE ON album_images
  FOR EACH ROW
  EXECUTE FUNCTION update_album_image_count();

-- Function to update album updated_at timestamp
CREATE OR REPLACE FUNCTION update_album_updated_at()
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

-- Trigger for updating updated_at
CREATE TRIGGER update_albums_updated_at
  BEFORE UPDATE ON albums
  FOR EACH ROW
  EXECUTE FUNCTION update_album_updated_at();