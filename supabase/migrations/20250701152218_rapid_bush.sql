/*
  # Fix security warnings for database functions

  1. Security Fixes
    - Add SECURITY DEFINER and search_path to all functions
    - Fix function search path mutable warnings
    - Ensure proper security for all database functions

  2. Function Updates
    - update_tag_post_counts: Add security settings
    - update_updated_at_column: Add security settings  
    - get_user_storage_usage: Add security settings
    - update_image_likes: Add security settings
*/

-- Fix update_tag_post_counts function
CREATE OR REPLACE FUNCTION update_tag_post_counts()
RETURNS void 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE blog_tags 
  SET post_count = (
    SELECT COUNT(*)
    FROM blog_posts 
    WHERE status = 'published' 
    AND blog_tags.name = ANY(blog_posts.tags)
  );
END;
$$;

-- Fix update_updated_at_column function
CREATE OR REPLACE FUNCTION update_updated_at_column()
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

-- Fix get_user_storage_usage function
CREATE OR REPLACE FUNCTION get_user_storage_usage(user_uuid uuid)
RETURNS bigint 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN COALESCE(
    (SELECT SUM(size) FROM user_uploads WHERE user_id = user_uuid),
    0
  );
END;
$$;

-- Fix update_image_likes function
CREATE OR REPLACE FUNCTION update_image_likes(image_id uuid, increment_value integer)
RETURNS void 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE gallery_images 
  SET likes = GREATEST(0, likes + increment_value)
  WHERE id = image_id;
END;
$$;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION update_tag_post_counts() TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_storage_usage(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION update_image_likes(uuid, integer) TO authenticated;