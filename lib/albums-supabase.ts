import { supabase } from './supabase';
import { getCurrentUser } from './auth';
import { GalleryImage } from './gallery-supabase';

export interface Album {
  id: string;
  name: string;
  description?: string;
  coverImage?: string;
  authorId: string;
  authorName: string;
  createdAt: string;
  updatedAt: string;
  imageCount: number;
  isPublic: boolean;
  images?: GalleryImage[];
}

export interface AlbumImage {
  id: string;
  albumId: string;
  imageId: string;
  position: number;
  createdAt: string;
  image?: GalleryImage;
}

// Get all albums
export const getAlbums = async (includePrivate = false): Promise<Album[]> => {
  try {
    let query = supabase
      .from('albums')
      .select('*')
      .order('created_at', { ascending: false });

    if (!includePrivate) {
      query = query.eq('is_public', true);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching albums:', error);
      return [];
    }

    return data?.map(album => ({
      id: album.id,
      name: album.name,
      description: album.description || undefined,
      coverImage: album.cover_image || undefined,
      authorId: album.author_id,
      authorName: album.author_name,
      createdAt: album.created_at,
      updatedAt: album.updated_at,
      imageCount: album.image_count,
      isPublic: album.is_public
    })) || [];
  } catch (error) {
    console.error('Error in getAlbums:', error);
    return [];
  }
};

// Get single album with images
export const getAlbum = async (id: string): Promise<Album | null> => {
  try {
    const { data: albumData, error: albumError } = await supabase
      .from('albums')
      .select('*')
      .eq('id', id)
      .single();

    if (albumError || !albumData) {
      console.error('Error fetching album:', albumError);
      return null;
    }

    // Get album images
    const { data: albumImages, error: imagesError } = await supabase
      .from('album_images')
      .select(`
        *,
        gallery_images (*)
      `)
      .eq('album_id', id)
      .order('position', { ascending: true });

    if (imagesError) {
      console.error('Error fetching album images:', imagesError);
    }

    const images = albumImages?.map(ai => ({
      id: ai.gallery_images.id,
      url: ai.gallery_images.url,
      title: ai.gallery_images.title,
      description: ai.gallery_images.description || undefined,
      category: ai.gallery_images.category,
      tags: ai.gallery_images.tags || [],
      likes: ai.gallery_images.likes,
      author: ai.gallery_images.author_name,
      authorId: ai.gallery_images.author_id,
      createdAt: ai.gallery_images.created_at,
      size: ai.gallery_images.size || undefined
    })) || [];

    return {
      id: albumData.id,
      name: albumData.name,
      description: albumData.description || undefined,
      coverImage: albumData.cover_image || undefined,
      authorId: albumData.author_id,
      authorName: albumData.author_name,
      createdAt: albumData.created_at,
      updatedAt: albumData.updated_at,
      imageCount: albumData.image_count,
      isPublic: albumData.is_public,
      images
    };
  } catch (error) {
    console.error('Error in getAlbum:', error);
    return null;
  }
};

// Create album
export const createAlbum = async (albumData: {
  name: string;
  description?: string;
  isPublic?: boolean;
}): Promise<Album | null> => {
  try {
    const user = await getCurrentUser();
    if (!user) throw new Error('User not authenticated');

    const insertData = {
      name: albumData.name,
      description: albumData.description || null,
      author_id: user.id,
      author_name: user.name,
      is_public: albumData.isPublic !== false
    };

    const { data, error } = await supabase
      .from('albums')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      console.error('Error creating album:', error);
      return null;
    }

    return {
      id: data.id,
      name: data.name,
      description: data.description || undefined,
      coverImage: data.cover_image || undefined,
      authorId: data.author_id,
      authorName: data.author_name,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      imageCount: data.image_count,
      isPublic: data.is_public
    };
  } catch (error) {
    console.error('Error in createAlbum:', error);
    return null;
  }
};

// Update album
export const updateAlbum = async (
  albumId: string,
  updates: {
    name?: string;
    description?: string;
    isPublic?: boolean;
  }
): Promise<Album | null> => {
  try {
    const user = await getCurrentUser();
    if (!user) throw new Error('User not authenticated');

    const updateData: any = {};
    if (updates.name !== undefined) updateData.name = updates.name;
    if (updates.description !== undefined) updateData.description = updates.description || null;
    if (updates.isPublic !== undefined) updateData.is_public = updates.isPublic;

    const { data, error } = await supabase
      .from('albums')
      .update(updateData)
      .eq('id', albumId)
      .eq('author_id', user.id)
      .select()
      .single();

    if (error) {
      console.error('Error updating album:', error);
      return null;
    }

    return {
      id: data.id,
      name: data.name,
      description: data.description || undefined,
      coverImage: data.cover_image || undefined,
      authorId: data.author_id,
      authorName: data.author_name,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      imageCount: data.image_count,
      isPublic: data.is_public
    };
  } catch (error) {
    console.error('Error in updateAlbum:', error);
    return null;
  }
};

// Delete album
export const deleteAlbum = async (albumId: string): Promise<boolean> => {
  try {
    const user = await getCurrentUser();
    if (!user) throw new Error('User not authenticated');

    const { error } = await supabase
      .from('albums')
      .delete()
      .eq('id', albumId)
      .eq('author_id', user.id);

    if (error) {
      console.error('Error deleting album:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in deleteAlbum:', error);
    return false;
  }
};

// Add images to album
export const addImagesToAlbum = async (
  albumId: string,
  imageIds: string[]
): Promise<boolean> => {
  try {
    const user = await getCurrentUser();
    if (!user) throw new Error('User not authenticated');

    // Get current max position
    const { data: maxPositionData } = await supabase
      .from('album_images')
      .select('position')
      .eq('album_id', albumId)
      .order('position', { ascending: false })
      .limit(1);

    const startPosition = maxPositionData?.[0]?.position || 0;

    const insertData = imageIds.map((imageId, index) => ({
      album_id: albumId,
      image_id: imageId,
      position: startPosition + index + 1
    }));

    const { error } = await supabase
      .from('album_images')
      .insert(insertData);

    if (error) {
      console.error('Error adding images to album:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in addImagesToAlbum:', error);
    return false;
  }
};

// Remove image from album
export const removeImageFromAlbum = async (
  albumId: string,
  imageId: string
): Promise<boolean> => {
  try {
    const user = await getCurrentUser();
    if (!user) throw new Error('User not authenticated');

    const { error } = await supabase
      .from('album_images')
      .delete()
      .eq('album_id', albumId)
      .eq('image_id', imageId);

    if (error) {
      console.error('Error removing image from album:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in removeImageFromAlbum:', error);
    return false;
  }
};

// Get user's albums
export const getUserAlbums = async (): Promise<Album[]> => {
  try {
    const user = await getCurrentUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from('albums')
      .select('*')
      .eq('author_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching user albums:', error);
      return [];
    }

    return data?.map(album => ({
      id: album.id,
      name: album.name,
      description: album.description || undefined,
      coverImage: album.cover_image || undefined,
      authorId: album.author_id,
      authorName: album.author_name,
      createdAt: album.created_at,
      updatedAt: album.updated_at,
      imageCount: album.image_count,
      isPublic: album.is_public
    })) || [];
  } catch (error) {
    console.error('Error in getUserAlbums:', error);
    return [];
  }
};