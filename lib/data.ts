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

// Mock user data - completely empty profiles
export const userData = {
  "1": { // John Doe
    savedBlogs: [],
    uploadedImages: [],
    collections: [],
    storageUsed: 0, // MB
    storageLimit: 500, // MB (500MB limit)
    activityHistory: [],
    profilePicture: "https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=1"
  },
  "2": { // Jane Smith
    savedBlogs: [],
    uploadedImages: [],
    collections: [],
    storageUsed: 0,
    storageLimit: 500,
    activityHistory: [],
    profilePicture: "https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=1"
  },
  "3": { // Admin User
    savedBlogs: [],
    uploadedImages: [],
    collections: [],
    storageUsed: 0,
    storageLimit: 500,
    activityHistory: [],
    profilePicture: "https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=1"
  }
};