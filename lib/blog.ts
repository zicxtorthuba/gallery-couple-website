export interface BlogPost {
  id: string;
  title: string;
  content: string;
  excerpt: string;
  featuredImage?: string;
  customIcon?: string;
  author: string;
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

// Blog storage functions
export const getBlogPosts = (): BlogPost[] => {
  if (typeof window === 'undefined') return [];
  try {
    const posts = localStorage.getItem('blogPosts');
    return posts ? JSON.parse(posts) : [];
  } catch {
    return [];
  }
};

export const saveBlogPosts = (posts: BlogPost[]) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('blogPosts', JSON.stringify(posts));
  }
};

export const getBlogTags = (): BlogTag[] => {
  if (typeof window === 'undefined') return [];
  try {
    const tags = localStorage.getItem('blogTags');
    return tags ? JSON.parse(tags) : [];
  } catch {
    return [];
  }
};

export const saveBlogTags = (tags: BlogTag[]) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('blogTags', JSON.stringify(tags));
  }
};

export const createBlogPost = (postData: Partial<BlogPost>, authorId: string, authorName: string): BlogPost => {
  const now = new Date().toISOString();
  const post: BlogPost = {
    id: `post-${Date.now()}`,
    title: postData.title || '',
    content: postData.content || '',
    excerpt: postData.excerpt || generateExcerpt(postData.content || ''),
    featuredImage: postData.featuredImage,
    customIcon: postData.customIcon,
    author: authorName,
    authorAvatar: postData.authorAvatar || '',
    publishedAt: postData.status === 'published' ? now : '',
    createdAt: now,
    updatedAt: now,
    readTime: calculateReadTime(postData.content || ''),
    likes: 0,
    comments: 0,
    tags: postData.tags || [],
    status: postData.status || 'draft',
    revisionHistory: []
  };

  const posts = getBlogPosts();
  posts.unshift(post);
  saveBlogPosts(posts);
  
  return post;
};

export const updateBlogPost = (postId: string, updates: Partial<BlogPost>, authorName: string): BlogPost | null => {
  const posts = getBlogPosts();
  const postIndex = posts.findIndex(p => p.id === postId);
  
  if (postIndex === -1) return null;
  
  const currentPost = posts[postIndex];
  
  // Create revision if content changed
  if (updates.content && updates.content !== currentPost.content) {
    const revision: BlogRevision = {
      id: `rev-${Date.now()}`,
      title: currentPost.title,
      content: currentPost.content,
      createdAt: currentPost.updatedAt,
      author: currentPost.author
    };
    currentPost.revisionHistory.push(revision);
  }
  
  const updatedPost = {
    ...currentPost,
    ...updates,
    updatedAt: new Date().toISOString(),
    readTime: updates.content ? calculateReadTime(updates.content) : currentPost.readTime,
    excerpt: updates.content ? generateExcerpt(updates.content) : currentPost.excerpt,
    publishedAt: updates.status === 'published' && currentPost.status === 'draft' 
      ? new Date().toISOString() 
      : currentPost.publishedAt
  };
  
  posts[postIndex] = updatedPost;
  saveBlogPosts(posts);
  
  return updatedPost;
};

export const deleteBlogPost = (postId: string): boolean => {
  const posts = getBlogPosts();
  const filteredPosts = posts.filter(p => p.id !== postId);
  
  if (filteredPosts.length === posts.length) return false;
  
  saveBlogPosts(filteredPosts);
  return true;
};

export const createBlogTag = (name: string, color: string, category?: string): BlogTag => {
  const tags = getBlogTags();
  const tag: BlogTag = {
    id: `tag-${Date.now()}`,
    name: name.toLowerCase(),
    color,
    category,
    postCount: 0,
    createdAt: new Date().toISOString()
  };
  
  tags.push(tag);
  saveBlogTags(tags);
  
  return tag;
};

export const updateTagCounts = () => {
  const posts = getBlogPosts();
  const tags = getBlogTags();
  
  tags.forEach(tag => {
    tag.postCount = posts.filter(post => 
      post.tags.includes(tag.name) && post.status === 'published'
    ).length;
  });
  
  saveBlogTags(tags);
};

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