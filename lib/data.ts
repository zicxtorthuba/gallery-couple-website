// Mock data for gallery images - empty to allow user uploads
export const galleryImages: Array<{
  id: string;
  url: string;
  title: string;
  category: string;
  tags: string[];
  likes: number;
  author: string;
  createdAt: string;
  description?: string;
}> = [];

// Mock data for blog posts - empty to allow user creation
export const blogPosts: Array<{
  id: string;
  title: string;
  excerpt: string;
  content: string;
  featuredImage: string;
  author: string;
  authorAvatar: string;
  publishedAt: string;
  readTime: number;
  likes: number;
  comments: number;
  tags: string[];
}> = [];

// Mock user data
export const userData = {
  user1: {
    savedBlogs: [],
    uploadedImages: [],
    collections: [],
    storageUsed: 0, // MB
    storageLimit: 500, // MB (500MB limit)
    activityHistory: [],
    profilePicture: null as string | null
  },
  user2: {
    savedBlogs: [],
    uploadedImages: [],
    collections: [],
    storageUsed: 0,
    storageLimit: 500,
    activityHistory: [],
    profilePicture: null as string | null
  },
  admin: {
    savedBlogs: [],
    uploadedImages: [],
    collections: [],
    storageUsed: 0,
    storageLimit: 500, // Even admin gets 500MB
    activityHistory: [],
    profilePicture: null as string | null
  }
};