import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Validate environment variables
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables');
  throw new Error('Missing Supabase configuration');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'implicit'
  },
  global: {
    fetch: (url, options = {}) => {
      // Enhanced fetch with better timeout and retry logic
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 20000); // Increased to 20 seconds
      
      return fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          ...options.headers,
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      }).finally(() => {
        clearTimeout(timeoutId);
      }).catch((error) => {
        if (error.name === 'AbortError') {
          throw new Error('Request timeout - please check your internet connection');
        }
        throw error;
      });
    }
  }
});

export type Database = {
  public: {
    Tables: {
      blog_posts: {
        Row: {
          id: string;
          title: string;
          content: string;
          excerpt: string | null;
          featured_image: string | null;
          custom_icon: string | null;
          author_id: string;
          author_name: string;
          author_avatar: string | null;
          published_at: string | null;
          created_at: string;
          updated_at: string;
          read_time: number;
          likes: number;
          comments: number;
          tags: string[];
          status: 'draft' | 'published';
          revision_history: any[];
        };
        Insert: {
          id?: string;
          title: string;
          content: string;
          excerpt?: string | null;
          featured_image?: string | null;
          custom_icon?: string | null;
          author_id: string;
          author_name: string;
          author_avatar?: string | null;
          published_at?: string | null;
          created_at?: string;
          updated_at?: string;
          read_time?: number;
          likes?: number;
          comments?: number;
          tags?: string[];
          status?: 'draft' | 'published';
          revision_history?: any[];
        };
        Update: {
          id?: string;
          title?: string;
          content?: string;
          excerpt?: string | null;
          featured_image?: string | null;
          custom_icon?: string | null;
          author_id?: string;
          author_name?: string;
          author_avatar?: string | null;
          published_at?: string | null;
          created_at?: string;
          updated_at?: string;
          read_time?: number;
          likes?: number;
          comments?: number;
          tags?: string[];
          status?: 'draft' | 'published';
          revision_history?: any[];
        };
      };
      blog_tags: {
        Row: {
          id: string;
          name: string;
          color: string;
          category: string | null;
          post_count: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          color?: string;
          category?: string | null;
          post_count?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          color?: string;
          category?: string | null;
          post_count?: number;
          created_at?: string;
        };
      };
      user_uploads: {
        Row: {
          id: string;
          url: string;
          filename: string;
          size: number;
          user_id: string;
          type: 'gallery' | 'blog';
          associated_id: string | null;
          uploaded_at: string;
        };
        Insert: {
          id?: string;
          url: string;
          filename: string;
          size: number;
          user_id: string;
          type: 'gallery' | 'blog';
          associated_id?: string | null;
          uploaded_at?: string;
        };
        Update: {
          id?: string;
          url?: string;
          filename?: string;
          size?: number;
          user_id?: string;
          type?: 'gallery' | 'blog';
          associated_id?: string | null;
          uploaded_at?: string;
        };
      };
      gallery_images: {
        Row: {
          id: string;
          url: string;
          title: string;
          description: string | null;
          category: string;
          tags: string[];
          likes: number;
          author_id: string;
          author_name: string;
          size: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          url: string;
          title: string;
          description?: string | null;
          category?: string;
          tags?: string[];
          likes?: number;
          author_id: string;
          author_name: string;
          size?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          url?: string;
          title?: string;
          description?: string | null;
          category?: string;
          tags?: string[];
          likes?: number;
          author_id?: string;
          author_name?: string;
          size?: number;
          created_at?: string;
        };
      };
    };
  };
};