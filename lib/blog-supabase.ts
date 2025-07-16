import { supabase } from './supabase';
import { getCurrentUser } from './auth';

export interface BlogPost {
  id: string;
  title: string;
  content: string;
  excerpt: string;
  featuredImage?: string;
  customIcon?: string;
  titleFont?: string;
  contentFont?: string;
  author: string;
  authorId: string;
  authorAvatar: string;
  publishedAt: string;
  createdAt: string;
  updatedAt: string;
  readTime: number;
  likes: number;
  comments: number;
  tags: string[];
  status: 'draft' | 'published';
  revisionHistory: BlogRevision[];
}

export interface BlogRevision {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  author: string;
}

export interface BlogTag {
  id: string;
  name: string;
  color: string;
  category?: string;
  postCount: number;
  createdAt: string;
}

// Blog Posts Functions
export const getBlogPosts = async (includeUnpublished = false): Promise<BlogPost[]> => {
  try {
    let query = supabase
      .from('blog_posts')
      .select('*')
      .order('created_at', { ascending: false });

    if (!includeUnpublished) {
      query = query.eq('status', 'published');
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching blog posts:', error);
      return [];
    }

    return data?.map(post => ({
      id: post.id,
      title: post.title,
      content: post.content,
      excerpt: post.excerpt || generateExcerpt(post.content),
      featuredImage: post.featured_image || undefined,
      customIcon: post.custom_icon || undefined,
      titleFont: post.title_font || undefined,
      contentFont: post.content_font || undefined,
      author: post.author_name,
      authorId: post.author_id,
      authorAvatar: post.author_avatar || '',
      publishedAt: post.published_at || '',
      createdAt: post.created_at,
      updatedAt: post.updated_at,
      readTime: post.read_time,
      likes: post.likes,
      comments: post.comments,
      tags: post.tags || [],
      status: post.status,
      revisionHistory: post.revision_history || []
    })) || [];
  } catch (error) {
    console.error('Error in getBlogPosts:', error);
    return [];
  }
};

export const getBlogPost = async (id: string): Promise<BlogPost | null> => {
  try {
    const { data, error } = await supabase
      .from('blog_posts')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      console.error('Error fetching blog post:', error);
      return null;
    }

    return {
      id: data.id,
      title: data.title,
      content: data.content,
      excerpt: data.excerpt || generateExcerpt(data.content),
      featuredImage: data.featured_image || undefined,
      customIcon: data.custom_icon || undefined,
      titleFont: data.title_font || undefined,
      contentFont: data.content_font || undefined,
      author: data.author_name,
      authorId: data.author_id,
      authorAvatar: data.author_avatar || '',
      publishedAt: data.published_at || '',
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      readTime: data.read_time,
      likes: data.likes,
      comments: data.comments,
      tags: data.tags || [],
      status: data.status,
      revisionHistory: data.revision_history || []
    };
  } catch (error) {
    console.error('Error in getBlogPost:', error);
    return null;
  }
};

export const createBlogPost = async (postData: Partial<BlogPost>): Promise<BlogPost | null> => {
  try {
    const user = await getCurrentUser();
    if (!user) throw new Error('User not authenticated');

    const now = new Date().toISOString();
    const readTime = calculateReadTime(postData.content || '');
    const excerpt = generateExcerpt(postData.content || '');

    const insertData = {
      title: postData.title || '',
      content: postData.content || '',
      excerpt,
      featured_image: postData.featuredImage || null,
      custom_icon: postData.customIcon || null,
      title_font: postData.titleFont,
      content_font: postData.contentFont,
      author_id: user.id,
      author_name: user.name,
      author_avatar: user.image || null,
      published_at: postData.status === 'published' ? now : null,
      read_time: readTime,
      tags: postData.tags || [],
      status: postData.status || 'draft',
      revision_history: []
    };

    const { data, error } = await supabase
      .from('blog_posts')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      console.error('Error creating blog post:', error);
      return null;
    }

    // Update tag counts
    await updateTagCounts();

    return {
      id: data.id,
      title: data.title,
      content: data.content,
      excerpt: data.excerpt || excerpt,
      featuredImage: data.featured_image || undefined,
      customIcon: data.custom_icon || undefined,
      titleFont: data.title_font || undefined,
      contentFont: data.content_font || undefined,
      author: data.author_name,
      authorId: data.author_id,
      authorAvatar: data.author_avatar || '',
      publishedAt: data.published_at || '',
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      readTime: data.read_time,
      likes: data.likes,
      comments: data.comments,
      tags: data.tags || [],
      status: data.status,
      revisionHistory: data.revision_history || []
    };
  } catch (error) {
    console.error('Error in createBlogPost:', error);
    return null;
  }
};

export const updateBlogPost = async (postId: string, updates: Partial<BlogPost>): Promise<BlogPost | null> => {
  try {
    const user = await getCurrentUser();
    if (!user) throw new Error('User not authenticated');

    // Get current post for revision history
    const currentPost = await getBlogPost(postId);
    if (!currentPost) return null;

    let revisionHistory = currentPost.revisionHistory || [];

    // Create revision if content changed
    if (updates.content && updates.content !== currentPost.content) {
      const revision: BlogRevision = {
        id: `rev-${Date.now()}`,
        title: currentPost.title,
        content: currentPost.content,
        createdAt: currentPost.updatedAt,
        author: currentPost.author
      };
      revisionHistory = [...revisionHistory, revision];
    }

    const updateData: any = {
      updated_at: new Date().toISOString()
    };

    if (updates.title !== undefined) updateData.title = updates.title;
    if (updates.content !== undefined) {
      updateData.content = updates.content;
      updateData.excerpt = generateExcerpt(updates.content);
      updateData.read_time = calculateReadTime(updates.content);
    }
    if (updates.featuredImage !== undefined) updateData.featured_image = updates.featuredImage;
    if (updates.customIcon !== undefined) updateData.custom_icon = updates.customIcon;
    if (updates.tags !== undefined) updateData.tags = updates.tags;
    if (updates.status !== undefined) {
      updateData.status = updates.status;
      if (updates.status === 'published' && currentPost.status === 'draft') {
        updateData.published_at = new Date().toISOString();
      }
    }

    updateData.revision_history = revisionHistory;

    const { data, error } = await supabase
      .from('blog_posts')
      .update(updateData)
      .eq('id', postId)
      .eq('author_id', user.id)
      .select()
      .single();

    if (error) {
      console.error('Error updating blog post:', error);
      return null;
    }

    // Update tag counts
    await updateTagCounts();

    return {
      id: data.id,
      title: data.title,
      content: data.content,
      excerpt: data.excerpt || generateExcerpt(data.content),
      featuredImage: data.featured_image || undefined,
      customIcon: data.custom_icon || undefined,
      titleFont: data.title_font || undefined,
      contentFont: data.content_font || undefined,
      author: data.author_name,
      authorId: data.author_id,
      authorAvatar: data.author_avatar || '',
      publishedAt: data.published_at || '',
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      readTime: data.read_time,
      likes: data.likes,
      comments: data.comments,
      tags: data.tags || [],
      status: data.status,
      revisionHistory: data.revision_history || []
    };
  } catch (error) {
    console.error('Error in updateBlogPost:', error);
    return null;
  }
};

export const deleteBlogPost = async (postId: string): Promise<boolean> => {
  try {
    const user = await getCurrentUser();
    if (!user) throw new Error('User not authenticated');

    // Get the post first to check for featured image
    const post = await getBlogPost(postId);
    
    // Delete the blog post from database
    const { error } = await supabase
      .from('blog_posts')
      .delete()
      .eq('id', postId)
      .eq('author_id', user.id);

    if (error) {
      console.error('Error deleting blog post:', error);
      return false;
    }

    // If the post had a featured image from Cloudinary, try to delete it
    if (post?.featuredImage && post.featuredImage.includes('cloudinary.com')) {
      try {
        // Call our API route to delete from Cloudinary
        const response = await fetch('/api/cloudinary/delete', {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ url: post.featuredImage }),
        });

        if (!response.ok) {
          console.warn('Failed to delete featured image from Cloudinary');
        } else {
          console.log('Successfully deleted featured image from Cloudinary');
        }
      } catch (cloudinaryError) {
        console.warn('Could not delete featured image from Cloudinary:', cloudinaryError);
        // Don't fail the entire operation if image deletion fails
      }
    }

    // Update tag counts
    await updateTagCounts();

    return true;
  } catch (error) {
    console.error('Error in deleteBlogPost:', error);
    return false;
  }
};

// Blog Tags Functions
export const getBlogTags = async (): Promise<BlogTag[]> => {
  try {
    const { data, error } = await supabase
      .from('blog_tags')
      .select('*')
      .order('name');

    if (error) {
      console.error('Error fetching blog tags:', error);
      return [];
    }

    return data?.map(tag => ({
      id: tag.id,
      name: tag.name,
      color: tag.color,
      category: tag.category || undefined,
      postCount: tag.post_count,
      createdAt: tag.created_at
    })) || [];
  } catch (error) {
    console.error('Error in getBlogTags:', error);
    return [];
  }
};

export const createBlogTag = async (name: string, color: string, category?: string): Promise<BlogTag | null> => {
  try {
    const { data, error } = await supabase
      .from('blog_tags')
      .insert({
        name: name.toLowerCase(),
        color,
        category: category || null
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating blog tag:', error);
      return null;
    }

    return {
      id: data.id,
      name: data.name,
      color: data.color,
      category: data.category || undefined,
      postCount: data.post_count,
      createdAt: data.created_at
    };
  } catch (error) {
    console.error('Error in createBlogTag:', error);
    return null;
  }
};

export const updateBlogTag = async (tagId: string, updates: Partial<BlogTag>): Promise<BlogTag | null> => {
  try {
    const updateData: any = {};
    if (updates.name !== undefined) updateData.name = updates.name.toLowerCase();
    if (updates.color !== undefined) updateData.color = updates.color;
    if (updates.category !== undefined) updateData.category = updates.category || null;

    const { data, error } = await supabase
      .from('blog_tags')
      .update(updateData)
      .eq('id', tagId)
      .select()
      .single();

    if (error) {
      console.error('Error updating blog tag:', error);
      return null;
    }

    return {
      id: data.id,
      name: data.name,
      color: data.color,
      category: data.category || undefined,
      postCount: data.post_count,
      createdAt: data.created_at
    };
  } catch (error) {
    console.error('Error in updateBlogTag:', error);
    return null;
  }
};

export const deleteBlogTag = async (tagId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('blog_tags')
      .delete()
      .eq('id', tagId);

    if (error) {
      console.error('Error deleting blog tag:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in deleteBlogTag:', error);
    return false;
  }
};

export const updateTagCounts = async (): Promise<void> => {
  try {
    await supabase.rpc('update_tag_post_counts');
  } catch (error) {
    console.error('Error updating tag counts:', error);
  }
};

// Utility functions
const generateExcerpt = (content: string, maxLength: number = 150): string => {
  const plainText = content.replace(/<[^>]*>/g, '').replace(/\n/g, ' ');
  return plainText.length > maxLength 
    ? plainText.substring(0, maxLength).trim() + '...'
    : plainText;
};

const calculateReadTime = (content: string): number => {
  const wordsPerMinute = 200;
  const words = content.replace(/<[^>]*>/g, '').split(/\s+/).length;
  return Math.ceil(words / wordsPerMinute);
};