-- Function to update image likes
CREATE OR REPLACE FUNCTION update_image_likes(image_id uuid, increment_value integer)
RETURNS void AS $$
BEGIN
  UPDATE gallery_images 
  SET likes = GREATEST(0, likes + increment_value)
  WHERE id = image_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION update_image_likes(uuid, integer) TO authenticated;