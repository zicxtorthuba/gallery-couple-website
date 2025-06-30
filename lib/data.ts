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

// Mock user data based on the login users
export const userData = {
  "1": { // John Doe
    savedBlogs: [],
    uploadedImages: [],
    collections: [
      {
        id: "1",
        name: "Kỷ niệm đẹp",
        images: [],
        createdAt: "2024-01-15"
      }
    ],
    storageUsed: 45, // MB
    storageLimit: 500, // MB (500MB limit)
    activityHistory: [
      {
        action: "Tạo bộ sưu tập",
        item: "Kỷ niệm đẹp",
        date: "2024-01-15"
      }
    ],
    profilePicture: "https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=1"
  },
  "2": { // Jane Smith
    savedBlogs: [],
    uploadedImages: [],
    collections: [],
    storageUsed: 23,
    storageLimit: 500,
    activityHistory: [
      {
        action: "Đăng nhập",
        item: "Hệ thống",
        date: "2024-01-20"
      }
    ],
    profilePicture: "https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=1"
  },
  "3": { // Admin User
    savedBlogs: [],
    uploadedImages: [],
    collections: [
      {
        id: "admin-1",
        name: "Bộ sưu tập Admin",
        images: [],
        createdAt: "2024-01-01"
      },
      {
        id: "admin-2", 
        name: "Ảnh hệ thống",
        images: [],
        createdAt: "2024-01-05"
      }
    ],
    storageUsed: 156,
    storageLimit: 500,
    activityHistory: [
      {
        action: "Quản lý hệ thống",
        item: "Cập nhật cấu hình",
        date: "2024-01-22"
      },
      {
        action: "Tạo bộ sưu tập",
        item: "Ảnh hệ thống", 
        date: "2024-01-05"
      }
    ],
    profilePicture: "https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=1"
  }
};