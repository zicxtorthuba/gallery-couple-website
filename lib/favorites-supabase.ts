import { supabase } from './supabase';
import { getCurrentUser } from './auth';

export interface UserFavorite {
  id: string;
  userId: string;
  itemType: 'gallery' | 'blog';
  itemId: string;
  createdAt: string;
}

export interface Comment {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export interface BlogComment extends Comment {
  blogPostId: string;
}

export interface GalleryComment extends Comment {
  galleryImageId: string;
}

// Favorites Functions
export const getUserFavorites = async (itemType?: 'gallery' | 'blog'): Promise<UserFavorite[]> => {
  try {
    const user = await getCurrentUser();
    if (!user) return [];

    let query = supabase
      .from('user_favorites')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (itemType) {
      query = query.eq('item_type', itemType);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching user favorites:', error);
      return [];
    }

    return data?.map(fav => ({
      id: fav.id,
      userId: fav.user_id,
      itemType: fav.item_type,
      itemId: fav.item_id,
      createdAt: fav.created_at
    })) || [];
  } catch (error) {
    console.error('Error in getUserFavorites:', error);
    return [];
  }
};

export const addToFavorites = async (itemType: 'gallery' | 'blog', itemId: string): Promise<boolean> => {
  try {
    const user = await getCurrentUser();
    if (!user) return false;

    const { error } = await supabase
      .from('user_favorites')
      .insert({
        user_id: user.id,
        item_type: itemType,
        item_id: itemId
      });

    if (error) {
      console.error('Error adding to favorites:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in addToFavorites:', error);
    return false;
  }
};

export const removeFromFavorites = async (itemType: 'gallery' | 'blog', itemId: string): Promise<boolean> => {
  try {
    const user = await getCurrentUser();
    if (!user) return false;

    const { error } = await supabase
      .from('user_favorites')
      .delete()
      .eq('user_id', user.id)
      .eq('item_type', itemType)
      .eq('item_id', itemId);

    if (error) {
      console.error('Error removing from favorites:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in removeFromFavorites:', error);
    return false;
  }
};

export const isFavorite = async (itemType: 'gallery' | 'blog', itemId: string): Promise<boolean> => {
  try {
    const user = await getCurrentUser();
    if (!user) return false;

    const { data, error } = await supabase
      .from('user_favorites')
      .select('id')
      .eq('user_id', user.id)
      .eq('item_type', itemType)
      .eq('item_id', itemId)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error checking favorite status:', error);
      return false;
    }

    return !!data;
  } catch (error) {
    console.error('Error in isFavorite:', error);
    return false;
  }
};

// Blog Comments Functions
export const getBlogComments = async (blogPostId: string): Promise<BlogComment[]> => {
  try {
    const { data, error } = await supabase
      .from('blog_comments')
      .select('*')
      .eq('blog_post_id', blogPostId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching blog comments:', error);
      return [];
    }

    return data?.map(comment => ({
      id: comment.id,
      blogPostId: comment.blog_post_id,
      userId: comment.user_id,
      userName: comment.user_name,
      userAvatar: comment.user_avatar || undefined,
      content: comment.content,
      createdAt: comment.created_at,
      updatedAt: comment.updated_at
    })) || [];
  } catch (error) {
    console.error('Error in getBlogComments:', error);
    return [];
  }
};

export const createBlogComment = async (blogPostId: string, content: string): Promise<BlogComment | null> => {
  try {
    const user = await getCurrentUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from('blog_comments')
      .insert({
        blog_post_id: blogPostId,
        user_id: user.id,
        user_name: user.name,
        user_avatar: user.image || null,
        content: content.trim()
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating blog comment:', error);
      return null;
    }

    return {
      id: data.id,
      blogPostId: data.blog_post_id,
      userId: data.user_id,
      userName: data.user_name,
      userAvatar: data.user_avatar || undefined,
      content: data.content,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    };
  } catch (error) {
    console.error('Error in createBlogComment:', error);
    return null;
  }
};

export const updateBlogComment = async (commentId: string, content: string): Promise<boolean> => {
  try {
    const user = await getCurrentUser();
    if (!user) return false;

    const { error } = await supabase
      .from('blog_comments')
      .update({ content: content.trim() })
      .eq('id', commentId)
      .eq('user_id', user.id);

    if (error) {
      console.error('Error updating blog comment:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in updateBlogComment:', error);
    return false;
  }
};

export const deleteBlogComment = async (commentId: string): Promise<boolean> => {
  try {
    const user = await getCurrentUser();
    if (!user) return false;

    const { error } = await supabase
      .from('blog_comments')
      .delete()
      .eq('id', commentId)
      .eq('user_id', user.id);

    if (error) {
      console.error('Error deleting blog comment:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in deleteBlogComment:', error);
    return false;
  }
};

// Gallery Comments Functions
export const getGalleryComments = async (galleryImageId: string): Promise<GalleryComment[]> => {
  try {
    const { data, error } = await supabase
      .from('gallery_comments')
      .select('*')
      .eq('gallery_image_id', galleryImageId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching gallery comments:', error);
      return [];
    }

    return data?.map(comment => ({
      id: comment.id,
      galleryImageId: comment.gallery_image_id,
      userId: comment.user_id,
      userName: comment.user_name,
      userAvatar: comment.user_avatar || undefined,
      content: comment.content,
      createdAt: comment.created_at,
      updatedAt: comment.updated_at
    })) || [];
  } catch (error) {
    console.error('Error in getGalleryComments:', error);
    return [];
  }
};

export const createGalleryComment = async (galleryImageId: string, content: string): Promise<GalleryComment | null> => {
  try {
    const user = await getCurrentUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from('gallery_comments')
      .insert({
        gallery_image_id: galleryImageId,
        user_id: user.id,
        user_name: user.name,
        user_avatar: user.image || null,
        content: content.trim()
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating gallery comment:', error);
      return null;
    }

    return {
      id: data.id,
      galleryImageId: data.gallery_image_id,
      userId: data.user_id,
      userName: data.user_name,
      userAvatar: data.user_avatar || undefined,
      content: data.content,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    };
  } catch (error) {
    console.error('Error in createGalleryComment:', error);
    return null;
  }
};

export const updateGalleryComment = async (commentId: string, content: string): Promise<boolean> => {
  try {
    const user = await getCurrentUser();
    if (!user) return false;

    const { error } = await supabase
      .from('gallery_comments')
      .update({ content: content.trim() })
      .eq('id', commentId)
      .eq('user_id', user.id);

    if (error) {
      console.error('Error updating gallery comment:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in updateGalleryComment:', error);
    return false;
  }
};

export const deleteGalleryComment = async (commentId: string): Promise<boolean> => {
  try {
    const user = await getCurrentUser();
    if (!user) return false;

    const { error } = await supabase
      .from('gallery_comments')
      .delete()
      .eq('id', commentId)
      .eq('user_id', user.id);

    if (error) {
      console.error('Error deleting gallery comment:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in deleteGalleryComment:', error);
    return false;
  }
};