import { supabase } from './supabase';
import { getCurrentUser } from './auth';

export interface GalleryImage {
  id: string;
  url: string;
  title: string;
  description?: string;
  category: string;
  tags: string[];
  likes: number;
  author: string;
  authorId: string;
  createdAt: string;
  size?: number;
}

// Get all gallery images
export const getGalleryImages = async (): Promise<GalleryImage[]> => {
  try {
    const { data, error } = await supabase
      .from('gallery_images')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching gallery images:', error);
      return [];
    }

    return data?.map(image => ({
      id: image.id,
      url: image.url,
      title: image.title,
      description: image.description || undefined,
      category: image.category,
      tags: image.tags || [],
      likes: image.likes,
      author: image.author_name,
      authorId: image.author_id,
      createdAt: image.created_at,
      size: image.size || undefined
    })) || [];
  } catch (error) {
    console.error('Error in getGalleryImages:', error);
    return [];
  }
};

// Get single gallery image
export const getGalleryImage = async (id: string): Promise<GalleryImage | null> => {
  try {
    const { data, error } = await supabase
      .from('gallery_images')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      console.error('Error fetching gallery image:', error);
      return null;
    }

    return {
      id: data.id,
      url: data.url,
      title: data.title,
      description: data.description || undefined,
      category: data.category,
      tags: data.tags || [],
      likes: data.likes,
      author: data.author_name,
      authorId: data.author_id,
      createdAt: data.created_at,
      size: data.size || undefined
    };
  } catch (error) {
    console.error('Error in getGalleryImage:', error);
    return null;
  }
};

// Create gallery image
export const createGalleryImage = async (imageData: {
  url: string;
  title: string;
  description?: string;
  category: string;
  tags: string[];
  size?: number;
}): Promise<GalleryImage | null> => {
  try {
    const user = await getCurrentUser();
    if (!user) throw new Error('User not authenticated');

    const insertData = {
      url: imageData.url,
      title: imageData.title,
      description: imageData.description || null,
      category: imageData.category,
      tags: imageData.tags,
      author_id: user.id,
      author_name: user.name,
      size: imageData.size || 0
    };

    const { data, error } = await supabase
      .from('gallery_images')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      console.error('Error creating gallery image:', error);
      return null;
    }

    return {
      id: data.id,
      url: data.url,
      title: data.title,
      description: data.description || undefined,
      category: data.category,
      tags: data.tags || [],
      likes: data.likes,
      author: data.author_name,
      authorId: data.author_id,
      createdAt: data.created_at,
      size: data.size || undefined
    };
  } catch (error) {
    console.error('Error in createGalleryImage:', error);
    return null;
  }
};

// Update gallery image
export const updateGalleryImage = async (
  imageId: string, 
  updates: {
    title?: string;
    description?: string;
    tags?: string[];
  }
): Promise<GalleryImage | null> => {
  try {
    const user = await getCurrentUser();
    if (!user) throw new Error('User not authenticated');

    const updateData: any = {};
    if (updates.title !== undefined) updateData.title = updates.title;
    if (updates.description !== undefined) updateData.description = updates.description || null;
    if (updates.tags !== undefined) updateData.tags = updates.tags;

    const { data, error } = await supabase
      .from('gallery_images')
      .update(updateData)
      .eq('id', imageId)
      .eq('author_id', user.id)
      .select()
      .single();

    if (error) {
      console.error('Error updating gallery image:', error);
      return null;
    }

    return {
      id: data.id,
      url: data.url,
      title: data.title,
      description: data.description || undefined,
      category: data.category,
      tags: data.tags || [],
      likes: data.likes,
      author: data.author_name,
      authorId: data.author_id,
      createdAt: data.created_at,
      size: data.size || undefined
    };
  } catch (error) {
    console.error('Error in updateGalleryImage:', error);
    return null;
  }
};

// Delete gallery image
export const deleteGalleryImage = async (imageId: string): Promise<boolean> => {
  try {
    const user = await getCurrentUser();
    if (!user) throw new Error('User not authenticated');

    const { error } = await supabase
      .from('gallery_images')
      .delete()
      .eq('id', imageId)
      .eq('author_id', user.id);

    if (error) {
      console.error('Error deleting gallery image:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in deleteGalleryImage:', error);
    return false;
  }
};

// Update image likes
export const updateImageLikes = async (imageId: string, increment: boolean): Promise<boolean> => {
  try {
    const { error } = await supabase.rpc('update_image_likes', {
      image_id: imageId,
      increment_value: increment ? 1 : -1
    });

    if (error) {
      console.error('Error updating image likes:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in updateImageLikes:', error);
    return false;
  }
};

// Get unique categories
export const getGalleryCategories = async (): Promise<string[]> => {
  try {
    const { data, error } = await supabase
      .from('gallery_images')
      .select('category')
      .not('category', 'is', null);

    if (error) {
      console.error('Error fetching categories:', error);
      return [];
    }

    const categories = Array.from(new Set(data?.map(item => item.category) || []));
    return categories.filter(Boolean);
  } catch (error) {
    console.error('Error in getGalleryCategories:', error);
    return [];
  }
};

// Get unique tags
export const getGalleryTags = async (): Promise<string[]> => {
  try {
    const { data, error } = await supabase
      .from('gallery_images')
      .select('tags');

    if (error) {
      console.error('Error fetching tags:', error);
      return [];
    }

    const allTags = data?.flatMap(item => item.tags || []) || [];
    return Array.from(new Set(allTags)).filter(Boolean);
  } catch (error) {
    console.error('Error in getGalleryTags:', error);
    return [];
  }
};