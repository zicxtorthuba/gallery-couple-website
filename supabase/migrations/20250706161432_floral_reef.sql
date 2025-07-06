/*
  # Add font columns to blog posts

  1. Changes
    - Add `title_font` column to blog_posts table
    - Add `content_font` column to blog_posts table
    - Both columns are optional text fields for storing font preferences

  2. Security
    - No changes to RLS policies needed
    - Existing policies will cover the new columns
*/

-- Add font columns to blog_posts table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'blog_posts' AND column_name = 'title_font'
  ) THEN
    ALTER TABLE blog_posts ADD COLUMN title_font text;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'blog_posts' AND column_name = 'content_font'
  ) THEN
    ALTER TABLE blog_posts ADD COLUMN content_font text;
  END IF;
END $$;